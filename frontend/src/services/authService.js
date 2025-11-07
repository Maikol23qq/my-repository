import { API_AUTH_URL } from "../config/api.js";

export const register = async (userData) => {
  const response = await fetch(`${API_AUTH_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al registrar usuario");
  }

  return await response.json();
};

export const login = async (credentials) => {
  const response = await fetch(`${API_AUTH_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al iniciar sesión");
  }

  return await response.json();
};
