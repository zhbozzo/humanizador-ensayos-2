import React, { useState } from 'react';
import InputSection from './InputSection';
import ResultsSection from './ResultsSection';
import { humanizeText } from '../services/api';
import { HumanizeRequest, HumanizeResponse } from '../types/api';

const HumanizerInterface: React.FC = () => {
  const [request, setRequest] = useState<HumanizeRequest>({
    text: '',
    budget: 0.2,
    preserve_entities: true,
    respect_style: false,
    style_sample: null
  });

  const [response, setResponse] = useState<HumanizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const handleSubmit = async () => {
    if (!request.text.trim()) {
      setError('Por favor, ingresa el texto a humanizar');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setProgress('Iniciando proceso de humanización...');

    // Crear array de timeouts para poder limpiarlos si hay error
    const timeouts: NodeJS.Timeout[] = [];
    
    try {
      // Simular pasos del proceso
      timeouts.push(setTimeout(() => setProgress('Extrayendo entidades académicas...'), 1000));
      timeouts.push(setTimeout(() => setProgress('Preservando números, fechas y citas...'), 2000));
      timeouts.push(setTimeout(() => setProgress('Enviando a DeepSeek para humanización...'), 3000));
      timeouts.push(setTimeout(() => setProgress('Aplicando técnicas anti-detección...'), 5000));
      timeouts.push(setTimeout(() => setProgress('Optimizando naturalidad del texto...'), 8000));
      timeouts.push(setTimeout(() => setProgress('Procesando respuesta... (esto puede tomar un momento)'), 10000));
      
      const result = await humanizeText(request);
      setProgress('¡Humanización completada!');
      setResponse(result);
      
      // Limpiar todos los timeouts
      timeouts.forEach(t => clearTimeout(t));
      
    } catch (err) {
      // Limpiar todos los timeouts si hay error
      timeouts.forEach(t => clearTimeout(t));
      setProgress('');
      setError(err instanceof Error ? err.message : 'Error procesando el texto');
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(''), 2000); // Limpiar mensaje después de 2 segundos
    }
  };

  const handleInputChange = (updates: Partial<HumanizeRequest>) => {
    setRequest(prev => ({ ...prev, ...updates }));
    // Clear results when input changes
    if (response) {
      setResponse(null);
    }
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <InputSection
        request={request}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        progress={progress}
      />

      {/* Results Section */}
      {response && (
        <ResultsSection
          response={response}
          originalText={request.text}
        />
      )}
    </div>
  );
};

export default HumanizerInterface;
