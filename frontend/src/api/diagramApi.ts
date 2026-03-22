import { env } from "../env";

const BASE_URL = env.VITE_API_BASE_URL;

// Interface definitions to enforce single responsibility and type safety (SOLID)
export interface DiagramPayload {
  title: string;
  flow_data: {
    nodes: any[];
    edges: any[];
    strokes?: any[];
  };
  raw_text_input?: string;
  thumbnail_url?: string;
}

export interface DiagramApiResponse {
  status: string;
  diagram_id?: string;
  message?: string;
  [key: string]: any;
}

export const diagramApi = {
  /**
   * Sends POST request to save a diagram with JWT token.
   * Separates API logic from UI logic.
   */
  save: async (data: DiagramPayload, token: string | null): Promise<DiagramApiResponse> => {
    const headers: Record<string, string> = { 
      "Content-Type": "application/json" 
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/save-diagram`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${BASE_URL}/diagrams`);
    return response.json();
  },
};
