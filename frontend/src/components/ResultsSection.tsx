import React, { useState } from 'react';
import { HumanizeResponse } from '../types/api';

interface ResultsSectionProps {
  response: HumanizeResponse;
  originalText: string;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ response, originalText }) => {
  const [activeTab, setActiveTab] = useState<'result' | 'diff' | 'metrics'>('result');

  const renderDiffToken = (item: any, index: number) => {
    if (item.type === 'equal') {
      return <span key={index} className="text-gray-900">{item.token}</span>;
    } else if (item.type === 'delete') {
      return (
        <span key={index} className="bg-red-100 text-red-800 line-through">
          {item.token}
        </span>
      );
    } else if (item.type === 'insert') {
      return (
        <span key={index} className="bg-green-100 text-green-800">
          {item.token}
        </span>
      );
    }
    return null;
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatFloat = (value: number) => value.toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Tab Header */}
      <div className="border-b">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('result')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'result'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Resultado
          </button>
          <button
            onClick={() => setActiveTab('diff')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'diff'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Diferencias
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'metrics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Métricas
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'result' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Texto Humanizado</h3>
              <button
                onClick={() => navigator.clipboard.writeText(response.result)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                📋 Copiar
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-gray-900">
                  {response.result}
                </p>
              </div>
            </div>
            
            {/* Character count comparison */}
            <div className="mt-4 text-sm text-gray-500 flex justify-between">
              <span>Original: {originalText.length} caracteres</span>
              <span>Humanizado: {response.result.length} caracteres</span>
            </div>
          </div>
        )}

        {activeTab === 'diff' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Comparación de Cambios</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="prose prose-sm max-w-none">
                <div className="leading-relaxed space-x-0">
                  {response.diff.map((item, index) => renderDiffToken(item, index))}
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
                <span className="text-gray-600">Texto añadido</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
                <span className="text-gray-600">Texto eliminado</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                <span className="text-gray-600">Sin cambios</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas de Análisis</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Metrics Cards */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-800 mb-1">
                  Porcentaje de Cambio
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatPercentage(response.metrics.change_ratio)}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Proporción del texto modificado
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-800 mb-1">
                  Palabras Raras
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {formatPercentage(response.metrics.rare_word_ratio)}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Palabras técnicas o complejas
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-800 mb-1">
                  Longitud Media de Oración
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {formatFloat(response.metrics.avg_sentence_len)}
                </div>
                <div className="text-xs text-purple-700 mt-1">
                  Palabras por oración
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm font-medium text-orange-800 mb-1">
                  Índice LIX
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {formatFloat(response.metrics.lix)}
                </div>
                <div className="text-xs text-orange-700 mt-1">
                  Medida de legibilidad
                </div>
              </div>
            </div>

            {/* LIX Interpretation */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Interpretación del Índice LIX
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Menos de 25: Muy fácil de leer</div>
                <div>• 25-35: Fácil de leer</div>
                <div>• 35-45: Nivel medio</div>
                <div>• 45-55: Difícil</div>
                <div>• Más de 55: Muy difícil</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {response.alerts && response.alerts.length > 0 && (
        <div className="border-t bg-blue-50 p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Información del Procesamiento</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {response.alerts.map((alert, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-1">•</span>
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultsSection;
