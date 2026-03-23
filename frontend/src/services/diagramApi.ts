import { API_URL } from "../env";

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
  save: async (data: DiagramPayload, token: string | null): Promise<DiagramApiResponse> => {
    const headers: Record<string, string> = { 
      "Content-Type": "application/json" 
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}/save-diagram`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_URL}/diagrams`);
    return response.json();
  },

  generateFlowText: async (text: string) => {
    return await fetch(
      `${API_URL}/generate-flow?text=${encodeURIComponent(text)}`,
      { method: "POST" }
    );
  },

  uploadProcessImage: async (formData: FormData) => {
    return await fetch(`${API_URL}/upload-process`, {
      method: "POST",
      body: formData,
    });
  }
};
