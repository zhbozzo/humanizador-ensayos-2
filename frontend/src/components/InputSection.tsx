import React from 'react';
import { HumanizeRequest } from '../types/api';

interface InputSectionProps {
  request: HumanizeRequest;
  onChange: (updates: Partial<HumanizeRequest>) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  progress?: string;
}

const InputSection: React.FC<InputSectionProps> = ({
  request,
  onChange,
  onSubmit,
  loading,
  error,
  progress
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ text: e.target.value });
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ budget: parseFloat(e.target.value) / 100 });
  };

  const handlePreserveEntitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ preserve_entities: e.target.checked });
  };

  const handleRespectStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ respect_style: e.target.checked });
  };

  const handleStyleSampleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ 
      style_sample: e.target.value.trim() || null 
    });
  };

  const budgetPercentage = Math.round(request.budget * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Configuración de Humanización
      </h2>

      <div className="space-y-6">
        {/* Main Text Input */}
        <div>
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
            Texto a humanizar
          </label>
          <textarea
            id="text-input"
            value={request.text}
            onChange={handleTextChange}
            placeholder="Pega tu texto aquí..."
            className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
          <p className="text-xs text-gray-500 mt-1">
            {request.text.length} caracteres
          </p>
        </div>

        {/* Budget Slider */}
        <div>
          <label htmlFor="budget-slider" className="block text-sm font-medium text-gray-700 mb-2">
            Grado de edición: {budgetPercentage}%
          </label>
          <input
            id="budget-slider"
            type="range"
            min="0"
            max="30"
            value={budgetPercentage}
            onChange={handleBudgetChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0% (mínimo)</span>
            <span>30% (máximo)</span>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="preserve-entities"
              type="checkbox"
              checked={request.preserve_entities}
              onChange={handlePreserveEntitiesChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="preserve-entities" className="ml-2 block text-sm text-gray-700">
              Preservar cifras/fechas/citas
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="respect-style"
              type="checkbox"
              checked={request.respect_style}
              onChange={handleRespectStyleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="respect-style" className="ml-2 block text-sm text-gray-700">
              Respetar mi estilo
            </label>
          </div>
        </div>

        {/* Style Sample */}
        {request.respect_style && (
          <div>
            <label htmlFor="style-sample" className="block text-sm font-medium text-gray-700 mb-2">
              Muestra de estilo (opcional)
            </label>
            <textarea
              id="style-sample"
              value={request.style_sample || ''}
              onChange={handleStyleSampleChange}
              placeholder="Pega un ejemplo de tu estilo de escritura..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ejemplo de tu estilo de escritura para que el humanizador lo imite
            </p>
          </div>
        )}

        {/* Progress Display */}
        {loading && progress && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded animate-pulse">
            <div className="flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">{progress}</span>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={onSubmit}
            disabled={loading || !request.text.trim()}
            className={`px-6 py-2 rounded-md font-medium ${
              loading || !request.text.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } transition-colors`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Humanizando...
              </span>
            ) : (
              'Humanizar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;
