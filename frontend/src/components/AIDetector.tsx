import React, { useState } from 'react';
import { detectAI } from '../services/api';
import { DetectResponse } from '../types/api';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  TrendingUp,
  Type,
  Hash,
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function AIDetector() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectResponse | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [phase, setPhase] = useState<string>('');
  const [phaseMsg, setPhaseMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async () => {
    if (!text.trim()) {
      setError('Por favor, ingresa un texto para analizar');
      return;
    }

    if (text.length < 50) {
      setError('El texto debe tener al menos 50 caracteres para un análisis confiable');
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
      setError(err instanceof Error ? err.message : 'Error al analizar el texto');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getClassificationIcon = (classification: string) => {
    if (classification.includes('Muy Humano')) return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (classification.includes('Probablemente Humano')) return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (classification.includes('Mixto')) return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    return <AlertTriangle className="w-6 h-6 text-red-600" />;
  };

  const renderMetricBar = (value: number, label: string, icon: React.ReactNode) => {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            {icon}
            <span className="text-gray-600">{label}</span>
          </div>
          <span className="font-medium">{value.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(value)}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          🔍 Detector de IA
        </h2>
        <p className="text-gray-600">
          Analiza cualquier texto para detectar si fue generado por IA (similar a GPT-Zero)
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto a Analizar
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pega aquí el texto que quieres analizar..."
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="mt-2 text-sm text-gray-500 text-right">
              {text.length} caracteres
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleDetect}
            disabled={loading || !text.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                Analizando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                Detectar IA
              </span>
            )}
          </button>

          {/* Barra de progreso de detección */}
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
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Score Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {getClassificationIcon(result.classification)}
              </div>
              
              <div>
                <div className="text-5xl font-bold mb-2">
                  <span className={getScoreColor(result.human_score)}>
                    {result.human_score.toFixed(1)}%
                  </span>
                  <span className="text-gray-400 text-3xl ml-2">Humano</span>
                </div>
                
                <div className="text-lg text-gray-600 mt-2">
                  Clasificación: <span className="font-semibold">{result.classification}</span>
                </div>
              </div>

              {/* Visual Score Bar */}
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div 
                      className={`h-6 rounded-full transition-all duration-1000 ${getProgressBarColor(result.human_score)}`}
                      style={{ width: `${result.human_score}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>0% (IA)</span>
                    <span>50%</span>
                    <span>100% (Humano)</span>
                  </div>
                </div>
              </div>

              {/* Probability Badges */}
              <div className="flex justify-center gap-4 mt-4">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">Probabilidad IA:</span>
                  <span className="ml-2 font-semibold text-blue-700">
                    {result.ai_probability.toFixed(1)}%
                  </span>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">Probabilidad Humana:</span>
                  <span className="ml-2 font-semibold text-green-700">
                    {result.human_score.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Métricas Detalladas
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {renderMetricBar(
                result.metrics.perplexity, 
                'Perplejidad', 
                <Sparkles className="w-4 h-4 text-purple-500" />
              )}
              {renderMetricBar(
                result.metrics.burstiness, 
                'Explosividad', 
                <Activity className="w-4 h-4 text-blue-500" />
              )}
              {renderMetricBar(
                result.metrics.sentence_variation, 
                'Variación de Oraciones', 
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
              {renderMetricBar(
                result.metrics.vocabulary_diversity, 
                'Diversidad de Vocabulario', 
                <Type className="w-4 h-4 text-indigo-500" />
              )}
              {renderMetricBar(
                result.metrics.pattern_score, 
                'Puntuación de Patrones', 
                <Hash className="w-4 h-4 text-orange-500" />
              )}
              {renderMetricBar(
                result.metrics.readability, 
                'Legibilidad', 
                <Type className="w-4 h-4 text-teal-500" />
              )}
              {renderMetricBar(
                result.metrics.repetition_score, 
                'Puntuación de Repetición', 
                <Hash className="w-4 h-4 text-pink-500" />
              )}
            </div>
          </div>

          {/* Analysis */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Análisis
            </h3>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {result.analysis}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Información Importante:</p>
                <p>
                  Este detector utiliza métricas avanzadas como perplejidad y explosividad para analizar patrones de texto.
                  Los resultados son estimaciones basadas en características estadísticas y no son 100% definitivos.
                  Un texto puede ser humano pero tener características que lo hagan parecer generado por IA y viceversa.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
