# Desplegar el frontend en Vercel

La aplicación usa Next.js en Vercel y un backend Python externo. SQLite, Chroma,
los PDF, las cargas y la indexación necesitan almacenamiento persistente; este
repositorio no los migra a funciones efímeras de Vercel.

## Backend en Vercel (perfil ligero)

Para un proyecto FastAPI separado usa la raíz del repositorio como Root Directory
y el preset FastAPI. `pyproject.toml` declara el entrypoint. `.vercelignore`
excluye los artefactos del frontend, pruebas y archivos locales, conservando backend, catálogo,
observaciones y PDF. La instalación básica no incluye ChromaDB ni sus dependencias
de inferencia vectorial; la recuperación por palabras clave y el catálogo siguen
disponibles, y la generación requiere claves y habilitación en el backend.

En Vercel, SQLite se crea en `/tmp/flame-data` por defecto. Ese directorio es
efímero y no se comparte entre instancias: índices, cachés e importaciones pueden
desaparecer. La carpeta de PDF incluida es de solo lectura; las cargas necesitan
almacenamiento externo. No se incluye una migración a una base de datos remota.
No configures `DATA_DIR` con una ruta del código desplegado.

ChromaDB es opcional (`pip install -e '.[semantic]'`) y los modelos científicos
también (`.[science]`). El perfil básico no permite estimaciones de los modelos;
los endpoints de estado y evidencia siguen disponibles. No instales el lock
local completo en Vercel: vuelve a incluir las dependencias pesadas. Si necesitas
todas estas funciones con persistencia, usa el servidor descrito a continuación.

Tras subir estos cambios, vuelve a desplegar el proyecto backend sin reutilizar
la caché de build y comprueba `/health` y `/api/investigations`. Después configura
su URL como `BACKEND_URL` del proyecto frontend. El tamaño final lo valida Vercel
durante su build; el tamaño local de dependencias es solo una referencia.

## Backend con persistencia y búsqueda vectorial

Despliega primero el backend en un servidor con Python 3.11+, disco persistente
y HTTPS. Desde la raíz del repositorio instala `pip install -e '.[science,semantic]'` y
arranca un único worker con:

```bash
uvicorn flame.main:app --app-dir backend --host 0.0.0.0 --port 8000
```

Configura `DATA_DIR` y `PAPERS_DIR` en el backend para apuntar al disco persistente.
Conserva `datasets/` junto al código. Ejecuta la indexación allí si necesitas la
biblioteca PDF (`python -m flame.cli ingest`). Verifica `GET /health`.
Las claves OpenAI/Anthropic, `ENABLE_PAID_API` y el token opcional
`FLAME_API_TOKEN` se configuran solo en el backend. Revisa autenticación y acceso
antes de exponer las operaciones de carga o indexación a visitantes públicos.

## Configuración en Vercel

1. Importa el repositorio y selecciona la rama que contenga estos cambios.
2. Establece **Root Directory: `frontend`** y **Framework Preset: Next.js**.
3. Usa **Node.js 24.x**, instalación `npm ci`, build `npm run build` y deja
   Output Directory con el valor predeterminado de Next.js.
4. En Environment Variables, define `BACKEND_URL=https://tu-backend.example.com`
   para Production y para Preview si lo usas. Debe ser el origen, sin `/api`,
   credenciales ni parámetros. No uses la propia URL del frontend.
5. Elimina `NEXT_PUBLIC_API_URL` si estaba configurada: todas las llamadas del
   navegador pasan por el proxy del frontend, incluidas las del asistente.
6. Ejecuta Deploy. Cuando cambies `BACKEND_URL`, vuelve a desplegar: las reglas
   del proxy se resuelven durante la compilación.

El build en Vercel falla con un mensaje explícito si falta `BACKEND_URL` o si
apunta a localhost o a HTTP. El desarrollo local conserva el puerto 8000 por
defecto. No copies `.env` ni claves al repositorio.

## Validación

Desde `frontend/`:

```bash
npm ci
npm run typecheck
npm run build
```

Después del despliegue, comprueba `/`, `/health`, `/api/investigations` y
`/api/catalog/source` en el dominio Vercel. Prueba el ranking y el asistente;
la generación requiere un proveedor configurado en el backend. Si el backend
usa token, comprueba también los flujos que necesitan autenticación.

Un build correcto verifica el frontend; no demuestra que el backend remoto esté
disponible. Comprueba límites de tiempo y tamaño del proxy de Vercel para las
consultas largas y las cargas PDF de tu plan.
