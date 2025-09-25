import React, { useState } from 'react'
import HumanizerInterface from './components/HumanizerInterface'
import AIDetector from './components/AIDetector'

interface DiffItem {
  type: 'insert' | 'delete' | 'equal';
  token: string;
}

interface ApiResponse {
  result: string;
  diff: DiffItem[];
  metrics: {
    change_ratio: number;
    rare_word_ratio: number;
    avg_sentence_len: number;
    lix: number;
  };
  alerts: string[];
}

function App() {
  const [activeView, setActiveView] = useState<'humanizer' | 'detector'>('humanizer');
  const [text, setText] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'result' | 'diff'>('original');
  const [humanizationLevel, setHumanizationLevel] = useState<'basic' | 'standard' | 'pro' | 'ultimate'>('standard');
  const [progressMessage, setProgressMessage] = useState('');
  
  const levelSettings = {
    basic: { budget: 0.3, label: 'Básico', description: 'Cambios sutiles' },
    standard: { budget: 0.5, label: 'Estándar', description: 'Balance óptimo' },
    pro: { budget: 0.7, label: 'Profesional', description: 'Máxima humanización' },
    ultimate: { budget: 0.85, label: 'Ultimate', description: 'Doble procesamiento' }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert('Por favor ingresa algún texto');
      return;
    }

    setLoading(true);
    setProgressMessage('Preparando solicitud...');
    
    const currentLevel = levelSettings[humanizationLevel];
    const requestData = {
      text: text,
      budget: currentLevel.budget,
      preserve_entities: true,
      respect_style: false,
      style_sample: null,
      level: humanizationLevel
    };
    
    console.log('Enviando petición con:', requestData);
    console.log('Budget value:', currentLevel.budget, 'Type:', typeof currentLevel.budget);
    
    try {
      // Use new SSE-based approach
      const useSSE = true; // Flag to switch between old and new approach
      
      if (useSSE) {
        // Start the task
        const startResponse = await fetch('http://localhost:8000/api/humanize/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });
        
        if (!startResponse.ok) {
          const errorData = await startResponse.text();
          throw new Error(`Error iniciando tarea: ${errorData}`);
        }
        
        const { task_id } = await startResponse.json();
        console.log('Task ID:', task_id);
        
        // Connect to SSE for progress updates
        const eventSource = new EventSource(`http://localhost:8000/api/humanize/progress/${task_id}`);
        
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('Progress update:', data);
          
          // Update progress message
          if (data.message) {
            setProgressMessage(data.message);
          }
          
          // Check if completed
          if (data.status === 'completed' || data.status === 'error') {
            eventSource.close();
            
            if (data.status === 'error') {
              throw new Error(data.message || 'Error en el procesamiento');
            }
            
            // Fetch the final result
            fetch(`http://localhost:8000/api/humanize/result/${task_id}`)
              .then(res => res.json())
              .then((resultData: ApiResponse) => {
                setResponse(resultData);
                setActiveTab('result');
                setProgressMessage('¡Completado!');
                setTimeout(() => {
                  setLoading(false);
                  setProgressMessage('');
                }, 500);
              })
              .catch(err => {
                console.error('Error obteniendo resultado:', err);
                alert('Error obteniendo el resultado: ' + err.message);
                setLoading(false);
                setProgressMessage('');
              });
          }
        };
        
        eventSource.onerror = (error) => {
          console.error('SSE Error:', error);
          eventSource.close();
          alert('Error en la conexión de progreso');
          setLoading(false);
          setProgressMessage('');
        };
        
      } else {
        // Fallback to old approach
        const apiResponse = await fetch('http://localhost:8000/api/humanize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        setProgressMessage('Procesando respuesta...');

        if (!apiResponse.ok) {
          const errorData = await apiResponse.text();
          throw new Error(`Error en la API: ${errorData}`);
        }

        const data: ApiResponse = await apiResponse.json();
        setProgressMessage('¡Completado!');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setResponse(data);
        setActiveTab('result');
        setLoading(false);
        setProgressMessage('');
      }
      
    } catch (error) {
      alert('Error: ' + error.message);
      console.error('Error completo:', error);
      setLoading(false);
      setProgressMessage('');
    }
  };

  const renderDiff = () => {
    if (!response?.diff) return null;
    
    return (
      <div style={{ 
        padding: '15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '4px',
        lineHeight: '1.6',
        fontSize: '14px'
      }}>
        {response.diff.map((item, index) => {
          let style: React.CSSProperties = {};
          
          if (item.type === 'insert') {
            style = {
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '2px 4px',
              borderRadius: '3px',
              margin: '0 1px'
            };
          } else if (item.type === 'delete') {
            style = {
              backgroundColor: '#f8d7da',
              color: '#721c24',
              textDecoration: 'line-through',
              padding: '2px 4px',
              borderRadius: '3px',
              margin: '0 1px'
            };
          }
          
          return (
            <span key={index} style={style}>
              {item.token}
              {item.token !== '.' && item.token !== ',' && item.token !== ';' ? ' ' : ''}
            </span>
          );
        })}
      </div>
    );
  };

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f0f8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#4a9eff',
        color: 'white',
        padding: '20px 0',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600' }}>
          Humanizador de Ensayos
        </h1>
        <p style={{ margin: '10px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
          Convierte tu texto en escritura 100% humana e indetectable
        </p>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: response ? '1fr 1fr' : '1fr',
          gap: '30px',
          alignItems: 'start'
        }}>
          
          {/* Input Panel */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>
              Tu Texto Original
            </h3>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pega tu texto académico aquí..."
              style={{
                width: '100%',
                height: '300px',
                padding: '15px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4a9eff'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '15px',
              fontSize: '13px',
              color: '#666'
            }}>
              <span>{wordCount} / 2000 palabras</span>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: '500' }}>Nivel:</label>
                {Object.entries(levelSettings).map(([key, settings]) => (
                  <button
                    key={key}
                    onClick={() => setHumanizationLevel(key as any)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      border: humanizationLevel === key ? '2px solid #4a9eff' : '1px solid #ddd',
                      borderRadius: '6px',
                      backgroundColor: humanizationLevel === key ? '#e3f2fd' : 'white',
                      color: humanizationLevel === key ? '#1976d2' : '#666',
                      cursor: 'pointer',
                      fontWeight: humanizationLevel === key ? '600' : 'normal',
                      transition: 'all 0.2s ease'
                    }}
                    title={settings.description}
                  >
                    {settings.label}
                    {key === 'ultimate' && ' 🚀'}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={loading || !text.trim()}
              style={{
                width: '100%',
                padding: '15px',
                marginTop: '20px',
                backgroundColor: loading || !text.trim() ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="spinner" style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span>Procesando...</span>
                  </div>
                  {progressMessage && (
                    <span style={{ fontSize: '12px', opacity: 0.9 }}>
                      {progressMessage}
                    </span>
                  )}
                </div>
              ) : (
                '✨ Humanizar Texto'
              )}
            </button>
            
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
          
          {/* Result Panel */}
          {response && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              
              {/* Success indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: '#d4edda',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#155724'
              }}>
                <span style={{ fontSize: '16px' }}>✓</span>
                <span>Texto humanizado exitosamente</span>
              </div>
              
              {/* Tabs */}
              <div style={{
                display: 'flex',
                marginBottom: '20px',
                borderBottom: '2px solid #f0f0f0'
              }}>
                {[
                  { key: 'result', label: 'Resultado' },
                  { key: 'diff', label: 'Diferencias' },
                  { key: 'metrics', label: 'Métricas' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: activeTab === tab.key ? '#4a9eff' : '#666',
                      borderBottom: activeTab === tab.key ? '2px solid #4a9eff' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeTab === tab.key ? '600' : 'normal'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {/* Tab Content */}
              {activeTab === 'result' && (
                <div>
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    lineHeight: '1.6',
                    fontSize: '14px',
                    minHeight: '250px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {response.result}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(response.result)}
                    style={{
                      marginTop: '15px',
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    📝 Copiar Texto
                  </button>
                </div>
              )}
              
              {activeTab === 'diff' && (
                <div>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Comparación de Cambios</h4>
                  <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                    <span style={{ backgroundColor: '#d4edda', padding: '2px 6px', borderRadius: '3px', marginRight: '10px' }}>
                      Verde: Añadido
                    </span>
                    <span style={{ backgroundColor: '#f8d7da', padding: '2px 6px', borderRadius: '3px' }}>
                      Rojo: Eliminado
                    </span>
                  </div>
                  {renderDiff()}
                </div>
              )}
              
              {activeTab === 'metrics' && (
                <div>
                  <h4 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Métricas del Texto</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                        {Math.round(response.metrics.change_ratio * 100)}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Texto Modificado</div>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                        {Math.round(response.metrics.lix)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Legibilidad LIX</div>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                        {response.metrics.avg_sentence_len.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Palabras/Oración</div>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
                        {Math.round(response.metrics.rare_word_ratio * 100)}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Palabras Complejas</div>
                    </div>
                  </div>
                  
                  {response.alerts && response.alerts.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Notas del Proceso:</h5>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
                        {response.alerts.map((alert, index) => (
                          <li key={index} style={{ marginBottom: '5px' }}>{alert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
