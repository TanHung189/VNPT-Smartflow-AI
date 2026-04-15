import { API_URL } from "../env";

const SERVER_URL = API_URL;

export const authApi = {
  login: async (formData: URLSearchParams) => {
    return await fetch(`${SERVER_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });
  },

  register: async (data: any) => {
    return await fetch(`${SERVER_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  googleLogin: async (token: string) => {
    return await fetch(`${SERVER_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  },
};
