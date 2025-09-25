import React, { useState } from 'react';
import { humanizeText } from '../services/api';

const HumanizerInterface: React.FC = () => {
  const [text, setText] = useState('');
  const [level, setLevel] = useState<'standard' | 'ultimate'>('standard');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Por favor, ingresa el texto a humanizar');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const request = {
        text,
        budget: level === 'ultimate' ? 0.85 : 0.75,
        preserve_entities: true,
        respect_style: false,
        style_sample: null,
        level,
        voice: 'collective'
      };

      const response = await humanizeText(request);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando el texto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Humanizador de Textos</h2>
        
        {/* Text Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texto a humanizar
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Pega tu texto aquí..."
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="mt-2 text-sm text-gray-500 text-right">
            {text.length} caracteres
          </div>
        </div>

        {/* Level Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de humanización
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setLevel('standard')}
              className={`p-4 rounded-lg border-2 transition-all ${
                level === 'standard'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">Standard</div>
              <div className="text-sm text-gray-600">~85% humano (1 pase)</div>
            </button>
            <button
              onClick={() => setLevel('ultimate')}
              className={`p-4 rounded-lg border-2 transition-all ${
                level === 'ultimate'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">Ultimate 🚀</div>
              <div className="text-sm text-gray-600">95%+ humano (3 pases)</div>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
            loading || !text.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              Humanizando...
            </span>
          ) : (
            'Humanizar Texto'
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Resultado</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <pre className="whitespace-pre-wrap text-sm">{result.result}</pre>
          </div>
          
          {/* Copy Button */}
          <button
            onClick={() => navigator.clipboard.writeText(result.result)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            📋 Copiar resultado
          </button>

          {/* Metrics */}
          {result.metrics && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Cambio</div>
                <div className="text-xl font-semibold">
                  {Math.round(result.metrics.change_ratio * 100)}%
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Legibilidad</div>
                <div className="text-xl font-semibold">
                  {Math.round(result.metrics.lix)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HumanizerInterface;
