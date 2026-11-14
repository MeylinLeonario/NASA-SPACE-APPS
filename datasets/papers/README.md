# Mediciones extraídas de los PDF de `papers`

Se examinaron los **19 PDF** del repositorio. Este paquete contiene **105 registros de extracción**, no 105 experimentos independientes. Las tablas y los valores seleccionados se transcribieron con sus páginas; las cuatro tablas principales de NASA TM-100195 se comprobaron visualmente. No se estimaron coordenadas de curvas ni se inventaron condiciones ausentes.

## Archivos

- `combustion-observations.json`: 70 filas con los campos obligatorios del contrato OOD; todas tienen `reviewed: false`. Contienen 70 velocidades de propagación y 50 longitudes de llama. No contienen umbrales de oxígeno convertidos artificialmente en observaciones puntuales ni temperaturas de llama inventadas.
- `extracted-measurements.csv`: los 105 registros, incluidos resultados incompletos, celdas originales, banderas y campos ausentes; se puede abrir en Excel. Las listas y celdas compuestas están serializadas como JSON en sus columnas.
- `extraction-audit.json`: inventario de los 19 documentos, huellas SHA-256, páginas PDF (numeración desde 1), ubicación de cada tabla/fila, valores originales, conversiones, exclusiones y notas. Este archivo permite verificar qué observación procede de qué PDF.

## Cargar el archivo local

Desde la raíz del repositorio, después de actualizar la rama `mey`, en PowerShell:

```powershell
.\.venv\Scripts\python.exe scripts\import_paper_observations.py --check
.\.venv\Scripts\python.exe scripts\import_paper_observations.py
```

El importador valida el esquema, comprueba las huellas de los PDF de origen y escribe `combustion-observations.json` en el `DATA_DIR` configurado del backend (por defecto `data/`). Conserva las filas ya existentes, incluidas las revisiones locales, y no duplica identificadores en importaciones posteriores. No modifica los PDF ni concede aprobación científica. Recarga la página después de importar: el panel mostrará las observaciones pendientes de revisión.

El archivo de `datasets/papers/` está versionado en Git; el archivo activo de `data/` permanece ignorado para preservar los cambios locales del usuario. No es necesario instalar el paquete en modo editable: el script encuentra `backend` desde su propia ubicación.

## Qué se extrajo

| Fuente | Registros de extracción | Filas exportadas al contrato OOD |
|---|---:|---:|
| Olson (1987), NASA TM-100195 | 89 | 68 |
| Manu B V y Amit Kumar, PMMA fino (manuscrito suministrado) | 2 | 2 |
| Resultados Saffire I/II (presentación) | 6 | 0 |
| Resultados preliminares Saffire VI, ICES-2024-365 | 5 | 0 |
| Kobayashi et al., SCEM/ISS, Fig. 1A | 2 | 0 |
| Manuscrito de propagación concurrente sobre aislamiento de cables | 1 | 0 |
| **Total** | **105** | **70** |

Las 89 entradas de Olson son 77 filas individuales de las tablas A-I–A-IV, 4 límites de extinción expresados como intervalos y 8 filas de una tabla secundaria de hipergravedad. De las 77 filas individuales se excluyeron 8 con propagación oscilatoria y 1 con una posible anomalía de impresión; quedan 68. No se añadieron como experimentos nuevos los promedios de las tablas ni sus repeticiones en la tabla II.

### NASA TM-100195

Sandra L. Olson, *The Effect of Microgravity on Flame Spread Over a Thin Fuel*, diciembre de 1987. Tabla A-I/A-II: página PDF 31 (impresa 26). Tabla A-III/A-IV: página PDF 32 (impresa 27). Condiciones: páginas PDF 11–12. Límites y errores: páginas PDF 33–34.

- Combustible: tejido Kimwipes, 99% celulosa y 1% resina de poliamida; muestras de aproximadamente 30 × 150 mm. Los espesores de 0.076 y 0.152 mm permanecen en configuraciones distintas.
- Presión: 1 atm → 101.325 kPa. Flujo externo impuesto: 0 cm/s (ambiente quiescente). No se confunde este flujo con la convección inducida por flotabilidad.
- El valor `gravity_g=0` es una **coordenada nominal de microgravedad**, coherente con la tabla II de la página PDF 26; no es una lectura de acelerómetro ni implica gravedad residual exactamente nula. El valor 1 identifica la condición de gravedad normal.
- Temperatura inicial: **null**. El informe indica que varió de 290 a 305 K; no se rellenó cada fila con 300 K, que aparece como propiedad para cálculos.
- Conversiones: cm/s × 10 → mm/s; cm × 10 → mm. Las tasas se toman de la columna individual `Vf`, no de `Average Vf`.
- Las longitudes con nota `b` (aún en transición) se conservan en la auditoría y se omiten del campo `length_mm` exportado. En gravedad normal la longitud corresponde al mínimo durante el parpadeo, según la definición de la página PDF 31; no es una media temporal.
- Las notas `a` identifican velocidades oscilatorias: esas filas están en la auditoría, no en el archivo OOD propuesto para propagación estacionaria.
- La segunda fila de 100% O2 en A-III repite el triplete 2.72 cm/s, 4.78 cm, 2.11 cm de otra tabla. Se transcribió como está impreso y se excluyó hasta aclararlo; no se corrigió por conjetura.
- La conclusión en la página PDF 29 asigna 26% al espesor simple, pero el Apéndice B.1.6 dice que este ardió a 21% y se extinguió a 20.5%. La auditoría conserva la evidencia detallada y señala la contradicción. Los cuatro límites se mantienen como pares «ardió a / se extinguió a», no como umbrales exactos ni desviaciones estándar.
- Los errores de repetibilidad (hasta 5.8% o 15%), tolerancias y rangos no se reinterpretaron como sigma gaussiana por observación. Por eso `uncertainty` permanece vacío.
- El grupo de dependencia abarca de forma conservadora todo el estudio. Los identificadores `...rowNN` son índices de transcripción, no números originales de ejecución recuperados.

### Otras fuentes con valores explícitos

**PMMA fino:** página PDF 7: 0.68 mm/s sin flujo y 0.53 mm/s a 25 cm/s, gravedad normal, cilindro de PMMA transparente colado de 1 mm de diámetro y 80 mm de longitud. La página PDF 1 especifica 21% O2 y 1 atm; páginas 2–3 definen material y geometría. El manuscrito suministrado no permite verificar sus metadatos editoriales; esa limitación está marcada. Ambas filas siguen pendientes de revisión.

**Saffire I/II:** tabla I, página PDF 29: tasas de 1.8, 1.3, 2.1 y 2.6 mm/s en microgravedad; 1.2 y 0.6 mm/s pertenecen a la columna de controles a 1 g para silicona. Las longitudes aproximadas de 40 y 24 mm se describen en la página PDF 21 y se muestran en la 20. No se asignó una presión que no figura en esta presentación, ni el oxígeno de vuelo a los controles terrestres. Las entradas conservan valores aproximados de oxígeno como notas, no como medidas exactas por ejecución.

**Saffire IV–VI:** las tablas 1 y 2 (páginas PDF 3 y 6) permiten asociar cinco muestras con presión, oxígeno, flujo, duración y calorimetría. La temperatura de salida del SFU **no es temperatura de llama**. No se convirtió longitud/duración en velocidad medida, ni potencia calorimétrica en otra salida del modelo.

**SCEM/ISS:** Fig. 1A, página PDF 7: pendientes explícitas de 1.47 mm/s (20 cm/s, 17.5% O2, modo 2D) y 0.56 mm/s (0 cm/s, 21.1% O2, modo flamelet). La presión de 101.3 kPa se menciona como máximo operativo, no como lectura de esas ejecuciones; permanece ausente. El ancho de muestra y la aceleración residual no están ligados inequívocamente a estas dos curvas. Los modos 2D y flamelet no se combinan.

**Aislamiento de cables:** la leyenda de Fig. 7 (página PDF 14) identifica 2.6 mm/s como experimental a 150 mm/s de flujo (=15 cm/s), 18% O2. La página 7 fija 1 atm. Se conserva como candidato incompleto por faltar la aceleración y la vinculación exacta de núcleo/geometría. Los valores cercanos de 1.2 mm/s, 11.4 mm y 1500 K corresponden a cálculos o suposiciones, no a tres mediciones adicionales.

## Estado de revisión y entrenamiento

**No se marcó ninguna extracción propia como revisada.** El JSON ya contiene observaciones reales transcritas; eso no equivale a validar su uso conjunto para regresión. Una revisión científica debe comprobar las fuentes, las convenciones de gravedad, las definiciones de salida, la compatibilidad y los grupos de dependencia antes de aprobar filas en el archivo activo. No basta con cambiar todos los `reviewed` a `true` para quitar el bloqueo.

No se entrenó ni se ejecutó validación científica con estas extracciones pendientes. En el subconjunto NASA solo existen dos niveles nominales de gravedad; además, el grupo conservador del estudio excluye todas sus filas al retener uno de esos niveles. Por tanto **no hay evidencia LOGO independiente** con este paquete. Las observaciones de hipergravedad citadas por Olson proceden de otro trabajo y otros materiales: no se mezclaron con Kimwipes para crear artificialmente más niveles.

El paquete no contiene observaciones directas de la Luna o Marte. Los resultados numéricos, las analogías, las previsiones de ensayos y las figuras aún no digitalizadas permanecen separados.

## Inventario de los 19 PDF

| PDF | Páginas | Registros / filas OOD | Evaluación de esta extracción |
|---|---:|---:|---|
| Combustion of Solids in Microgravity Results from the.pdf | 21 | 0 / 0 | Experimental presentation with plots/images; plotted output values not digitized in this pass. |
| Confined Combustion of Polymeric Solid Materials in microgravity.pdf | 37 | 0 / 0 | Experimental test matrix plus figures; no table of directly linked exact output values transcribed. Requires figure digitization, not trend-to-number conversion. |
| Dynamics of flame spread over filter papers in microgravity aboard the ISS.pdf | 8 | 2 / 0 | Two Figure 1A explicitly labeled slopes extracted. Run pressure and specimen width unresolved. |
| Effects of Ambient Conditions on Concurrent-Flow Flame Spread over a wide thin solid in microgravity.pdf | 22 | 0 / 0 | Numerical simulations with comparisons to prior Saffire data; do not count simulations or repeated literature data as new direct measurements. |
| Effects of Confinement on Flame Spread in Microgravity.pdf | 10 | 0 / 0 | BASS-II confinement experiments; main output points appear in figures. Additional extraction requires digitization with baffle/material conditioning. |
| Effects of Confinement on Opposed-Flow Flame Spread over Cellulose.pdf | 13 | 0 / 0 | ISS confinement experiments; Table 1 is a test matrix, not an output table. Figures need digitization with baffle and sidedness conditioning. |
| Effects of oxygen concentration of oxidizer flow on laminar diffusion flame established over liquid fuel beds at microgravity.pdf | 25 | 0 / 0 | Numerical liquid-fuel study; incompatible mechanism, no simulated values promoted to observations. |
| Fire Safety in Space – Beyond Flammability Testing of Small.pdf | 17 | 0 / 0 | Background/design and literature discussion. No additional unambiguous run-level numerical output rows extracted. |
| Fire safety in space – Investigating flame spread interaction over wires.pdf | 7 | 0 / 0 | Image-only ScienceDirect article preview; OCR recovered abstract/snippets/recommendations, not a full experimental table. Full article needed. |
| Flame spread Effects of microgravity and scale.pdf | 15 | 0 / 0 | Image-only ScienceDirect article preview; OCR recovered preview content. Overlaps Saffire campaigns; not counted as an independent dataset. |
| Flame spread over thin circular PMMA rods.pdf | 9 | 2 / 2 | Two explicit normal-gravity spread values extracted; additional plotted points require digitization. Supplied manuscript has unverified publication metadata. |
| Numerical study of concurrent flow flame spread over thin solids in.pdf | 9 | 0 / 0 | Numerical study. No direct experimental training rows added from simulated curves. |
| Preliminary results from the saffire VI Experiment.pdf | 7 | 5 / 0 | Five Table 1/2 samples extracted; output temperatures are at SFU outlet, not flame temperatures. Calorimetry is unsupported by current regression. |
| Quiescent flame spread and extinction over acrylic sheets in microgravity at increased oxygen concentration.pdf | 8 | 0 / 0 | SoFIE/RTDFS experimental curves with changing pressure/thickness; pointwise values require graph digitization and condition linkage. No invented graph coordinates. |
| Results of Large-Scale Spacecraft Flammability Tests.pdf | 36 | 6 / 0 | Table I rates and p20 flame lengths extracted; pressure missing, oxygen approximate. Ground-control columns kept distinct. |
| Saffire A Novel Approach to Study of Spacecraft Fire Safety Using Un-Manned Spacecraft.pdf | 32 | 0 / 0 | Experiment design/planning presentation. Planned test conditions are not completed experimental measurements. |
| The Effect of Microgravity on Flame Spread over a Thin Fuel.pdf | 50 | 89 / 68 | Four primary Appendix A tables fully transcribed, individual rows only; averages and duplicate Table II summaries excluded. Additional extinction brackets and secondary hypergravity table retained separately. |
| can spreading flame over electric wire insulation in concurrent flow achieve steady propagation in microgavity.pdf | 23 | 1 / 0 | One explicitly experimental spread rate extracted; nearby theoretical spread/length values excluded. |
| the effect of gravity on flame spread over pmma cylinders.pdf | 9 | 0 / 0 | Screened native text; further source-specific table or graph extraction required. No additional unambiguous run-level numeric outputs transcribed. |

Dos archivos eran impresiones de vistas previas de ScienceDirect y no ofrecían texto nativo; se aplicó OCR para identificar su contenido. Sus recomendaciones y fragmentos no se trataron como tablas del artículo completo. En otros documentos los valores están en gráficos: todavía requieren digitalización y enlace a cada condición; «0 filas exportadas» no significa que el artículo carezca de datos experimentales.

Para probar la importación sin escribir, usa `--check`. Para verificar conversiones, exclusiones, conservación de revisiones locales, huellas de origen y bloqueo de entrenamiento, ejecuta `pytest tests/test_paper_observations.py` con las dependencias de pruebas y ciencia instaladas.
