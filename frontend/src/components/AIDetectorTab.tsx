import React, { useState } from 'react';
import { detectAI } from '../services/api';

const AIDetectorTab: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState<number>(0);
  const [phase, setPhase] = useState<string>('');
  const [phaseMsg, setPhaseMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async () => {
    if (!text.trim()) {
      setError('Por favor, ingresa el texto a analizar');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setPhase('detecting');
    setPhaseMsg('Iniciando análisis...');

    try {
      const response = await detectAI({ text, language: 'es' }, (u) => {
        if (u.progress !== undefined) setProgress(u.progress);
        if (u.status) setPhase(u.status);
        if (u.message) setPhaseMsg(u.message);
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error analizando el texto');
    } finally {
      setLoading(false);
    }
  };

  const getColorByScore = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 20) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Detector de IA</h2>
      
      {/* Text Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto a analizar
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pega el texto que quieres analizar..."
          className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <div className="mt-2 text-sm text-gray-500 text-right">
          {text.length} caracteres
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Detect Button */}
      <button
        onClick={handleDetect}
        disabled={loading || !text.trim()}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
          loading || !text.trim()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            Analizando...
          </span>
        ) : (
          'Detectar IA'
        )}
      </button>

      {/* Barra de progreso */}
      {loading && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">
              {phase === 'detecting' ? '🔎 Detectando IA' : 'Procesando'}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out rounded-full ${progress >= 100 ? 'bg-green-600' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            >
              <div className="h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">{phaseMsg}</div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Main Result */}
          <div className={`border-2 rounded-xl p-6 ${getColorByScore(result.ai_probability)}`}>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {Math.round(result.ai_probability)}%
              </div>
              <div className="text-lg font-medium mb-1">
                Probabilidad de ser generado por IA
              </div>
              <div className="text-2xl font-bold">
                {result.classification}
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Métricas Detalladas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Perplejidad</span>
                  <span className="font-semibold">{result.metrics.perplexity.toFixed(1)}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${result.metrics.perplexity}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {result.metrics.perplexity < 40 ? 'Vocabulario predecible (IA)' : 'Vocabulario variado (Humano)'}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Explosividad</span>
                  <span className="font-semibold">{result.metrics.burstiness.toFixed(1)}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${result.metrics.burstiness}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {result.metrics.burstiness < 40 ? 'Oraciones uniformes (IA)' : 'Longitud variable (Humano)'}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Variación de Oraciones</span>
                  <span className="font-semibold">{result.metrics.sentence_variation.toFixed(1)}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${result.metrics.sentence_variation}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Diversidad Léxica</span>
                  <span className="font-semibold">{result.metrics.vocabulary_diversity.toFixed(1)}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-amber-600 h-2 rounded-full" 
                    style={{ width: `${result.metrics.vocabulary_diversity}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Análisis</h3>
            <p className="text-gray-700 whitespace-pre-line">{result.analysis}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDetectorTab;
