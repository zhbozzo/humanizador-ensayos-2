import React, { useState } from 'react';
import { humanizeText } from '../services/api';
import { HumanizeRequest, HumanizeResponse } from '../types/api';

const HumanizerInterfaceSimple: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError('');
    setResult('');
    
    const request: HumanizeRequest = {
      text: text,
      budget: 0.5,
      preserve_entities: true,
      respect_style: false,
      style_sample: null
    };
    
    try {
      console.log('Enviando petición...');
      const response = await humanizeText(request);
      console.log('Respuesta recibida:', response);
      setResult(response.result);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Prueba Simple</h1>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-32 p-2 border rounded mb-4"
        placeholder="Escribe tu texto aquí..."
        disabled={loading}
      />
      
      <button
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        className={`px-4 py-2 rounded ${
          loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {loading ? 'Procesando...' : 'Humanizar'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h3 className="font-bold mb-2">Resultado:</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};

export default HumanizerInterfaceSimple;
