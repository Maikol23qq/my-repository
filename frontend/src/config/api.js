// Configuración centralizada de la API
// En producción, usa la variable de entorno VITE_API_URL
// Si no está definida, usa la URL del backend desplegado en Render

const getApiBaseUrl = () => {
  // Si VITE_API_URL está definida, úsala (puede incluir /api/auth o ser solo la base)
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    // Si termina con /api/auth, removerlo para obtener la base
    return url.endsWith('/api/auth') ? url.replace('/api/auth', '') : url.replace(/\/api\/auth\/?$/, '');
  }
  
  // Fallback según el modo
  if (import.meta.env.MODE === 'production') {
    return 'https://wheells-backend-5dy4.onrender.com';
  }
  
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_AUTH_URL = `${API_BASE_URL}/api/auth`;
export const API_ONBOARDING_URL = `${API_BASE_URL}/api/onboarding`;
export const API_USER_URL = `${API_BASE_URL}/api/user`;
export const API_TRIPS_URL = `${API_BASE_URL}/api/trips`;

