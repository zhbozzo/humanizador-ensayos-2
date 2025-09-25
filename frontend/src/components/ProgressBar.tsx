import React from 'react';

interface ProgressBarProps {
  progress: number;
  status: string;
  message: string;
  showPercentage?: boolean;
  step?: number;
  total_steps?: number;
  phase?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  status, 
  message, 
  showPercentage = true,
  step,
  total_steps,
  phase
}) => {
  // Determinar el color según el estado
  const getColorClass = () => {
    switch (status) {
      case 'extracting':
        return 'bg-yellow-500';
      case 'rewriting':
        return 'bg-blue-500';
      case 'verifying':
        return 'bg-purple-500';
      case 'metrics':
        return 'bg-green-500';
      case 'detecting':
        return 'bg-indigo-500';
      case 'completed':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Obtener etiqueta de fase
  const getPhaseLabel = () => {
    switch (status) {
      case 'extracting':
        return '🔍 Extrayendo entidades';
      case 'rewriting':
        return '✍️ Humanizando texto';
      case 'verifying':
        return '✅ Verificando entidades';
      case 'metrics':
        return '📊 Calculando métricas';
      case 'detecting':
        return '🤖 Analizando IA';
      case 'completed':
        return '✨ Completado';
      case 'error':
        return '❌ Error';
      default:
        return '⏳ Procesando';
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Etiqueta de fase y mensaje */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-700">
            {phase ? `${getPhaseLabel()} · ${phase}` : getPhaseLabel()}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            {message}
            {typeof step === 'number' && typeof total_steps === 'number' && (
              <span> · Paso {Math.min(step, total_steps)}/{total_steps}</span>
            )}
          </span>
        </div>
        {showPercentage && (
          <span className="text-sm font-medium text-gray-600">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${getColorClass()}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {/* Efecto de brillo animado */}
          <div className="h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;