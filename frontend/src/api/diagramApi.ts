import { env } from "../env";

const BASE_URL = env.VITE_API_BASE_URL;

export const diagramApi = {
  save: async (data: any) => {
    const response = await fetch(`${BASE_URL}/save-diagram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${BASE_URL}/diagrams`);
    return response.json();
  },
};
