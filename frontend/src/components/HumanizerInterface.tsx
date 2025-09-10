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

  const handleSubmit = async () => {
    if (!request.text.trim()) {
      setError('Por favor, ingresa el texto a humanizar');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await humanizeText(request);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando el texto');
    } finally {
      setLoading(false);
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
