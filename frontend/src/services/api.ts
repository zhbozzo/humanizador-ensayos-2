import type { 
  HumanizeRequest, 
  HumanizeResponse, 
  DetectRequest, 
  DetectResponse 
} from '../types';

// URL del backend de humanización (FastAPI). No confundir con node-auth.
// En producción configura VITE_HUMANIZER_URL apuntando al servicio FastAPI en Render.
const HUMANIZER_URL = (import.meta as any).env?.VITE_HUMANIZER_URL
  || (import.meta as any).env?.VITE_BACKEND_URL
  || 'https://humaniza-api.onrender.com';

interface ProgressUpdate {
  progress?: number;
  status?: string;
  message?: string;
  step?: number;
  total_steps?: number;
  phase?: string;
  partial?: string;
}

// Función para humanizar texto con progreso
export async function humanizeText(
  request: HumanizeRequest, 
  onProgress?: (update: ProgressUpdate) => void
): Promise<HumanizeResponse> {
  try {
    // Primero iniciamos la tarea
    let startResponse = await fetch(`${HUMANIZER_URL}/api/humanize/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (startResponse.status === 404) {
      // Algunos despliegues no exponen /start: usar fallback directo
      const fallback = await fetch(`${HUMANIZER_URL}/api/humanize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!fallback.ok) {
        const errorData = await fallback.json().catch(() => null);
        throw new Error(errorData?.detail || `Error ${fallback.status}: ${fallback.statusText}`);
      }
      return await fallback.json();
    }

    if (!startResponse.ok) {
      const errorData = await startResponse.json().catch(() => null);
      throw new Error(errorData?.detail || `Error ${startResponse.status}: ${startResponse.statusText}`);
    }

    const { task_id } = await startResponse.json();

    // Conectar a SSE para recibir actualizaciones de progreso
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(`${HUMANIZER_URL}/api/humanize/progress/${task_id}`);
      let gotMessage = false;
      const safetyTimer = setTimeout(() => {
        if (!gotMessage) {
          try { eventSource.close(); } catch {}
          // Fallback directo si el stream no emite en 25s
          fetch(`${HUMANIZER_URL}/api/humanize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          })
          .then(res => {
            if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
            return res.json();
          })
          .then(resolve)
          .catch(reject);
        }
      }, 25000);
      
      eventSource.onmessage = (event) => {
        try {
          gotMessage = true;
          const data = JSON.parse(event.data);
          
          // Actualizar progreso
          if (onProgress) {
            onProgress({
              progress: data.progress,
              status: data.status,
              message: data.message,
              // @ts-ignore: campos extra de SSE
              step: data.step,
              total_steps: data.total_steps,
              phase: data.phase,
              partial: data.partial
            } as any);
          }
          
          // Si está completo, cerrar conexión y resolver
          if (data.status === 'completed' && data.result) {
            clearTimeout(safetyTimer); eventSource.close();
            resolve(data.result);
          } else if (data.status === 'error') {
            clearTimeout(safetyTimer); eventSource.close();
            reject(new Error(data.error || 'Error en el proceso'));
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };
      
      eventSource.onerror = (_error) => {
        clearTimeout(safetyTimer); eventSource.close();
        // Fallback al método tradicional si SSE falla
        fetch(`${HUMANIZER_URL}/api/humanize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })
        .then(res => res.json())
        .then(resolve)
        .catch(reject);
      };
      
      // Sin timeout: permitimos que el proceso finalize naturalmente
    });
  } catch (error) {
    console.error('Error humanizing text:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error de conexión');
  }
}

// Función para detectar IA con progreso
export async function detectAI(
  request: DetectRequest,
  onProgress?: (update: ProgressUpdate) => void
): Promise<DetectResponse> {
  try {
    // Intentar flujo SSE primero
    const startResponse = await fetch(`${HUMANIZER_URL}/api/detect/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!startResponse.ok) {
      throw new Error(`Error ${startResponse.status}: ${startResponse.statusText}`);
    }
    const { task_id } = await startResponse.json();

    return new Promise((resolve, reject) => {
      const es = new EventSource(`${HUMANIZER_URL}/api/detect/progress/${task_id}`);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onProgress) {
            onProgress({
              progress: data.progress,
              status: data.status,
              message: data.message,
              // @ts-ignore
              step: data.step,
              total_steps: data.total_steps,
              phase: data.phase
            } as any);
          }
          if (data.status === 'completed') {
            es.close();
            if (data.result) {
              resolve(data.result as DetectResponse);
            } else {
              // Fallback a obtener por /api/detect si no vino el payload
              fetch(`${HUMANIZER_URL}/api/detect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
              })
              .then(r => r.json())
              .then(resolve)
              .catch(reject);
            }
          } else if (data.status === 'error') {
            es.close();
            reject(new Error(data.error || 'Error en el proceso de detección'));
          }
        } catch (e) {
          console.error('Error parseando SSE de detección', e);
        }
      };
      es.onerror = () => {
        es.close();
        // Fallback a endpoint simple si SSE falla
        fetch(`${HUMANIZER_URL}/api/detect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        })
        .then(r => r.json())
        .then(resolve)
        .catch(reject);
      };

      // Sin timeout: dejamos el SSE abierto hasta completar o error
    });
  } catch (error) {
    console.error('Error detecting AI:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error de conexión');
  }
}
