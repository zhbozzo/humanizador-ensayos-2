import { HumanizeRequest, HumanizeResponse, ApiError } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If we can't parse the error response, use the generic message
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Error de conexión con el servidor');
      }
    }
  }

  async humanizeText(request: HumanizeRequest): Promise<HumanizeResponse> {
    return this.request<HumanizeResponse>('/api/humanize', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export the main function for easier importing
export const humanizeText = (request: HumanizeRequest) => 
  apiService.humanizeText(request);
