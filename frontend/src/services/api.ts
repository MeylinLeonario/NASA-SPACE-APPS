// frontend/src/services/api.ts

const API_BASE_URL = "http://localhost:8000/api";

export interface AtmospherePayload {
  o2: number;
  pressure_psi: number;
  flow: number;
  gravity: number;
  selected_pillar?: string;
}

export async function fetchMissionMatch(conditions: AtmospherePayload) {
  try {
    const response = await fetch(`${API_BASE_URL}/motor1/match-missions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(conditions),
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Retorna el ranking ordenado desde Python
  } catch (error) {
    console.error("Fallo al conectar con el backend de PyraScope:", error);
    return null;
  }
}