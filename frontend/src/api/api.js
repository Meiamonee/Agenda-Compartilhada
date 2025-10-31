import axios from "axios";

// Instância para o Serviço de Usuários (Login/Cadastro)
export const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL, 
});

// Instância para o Serviço de Eventos
export const eventsApi = axios.create({
  baseURL: import.meta.env.VITE_EVENTS_API_URL,
});

// Exporta o authApi como default para compatibilidade com outros arquivos (como o Login.js)
export default authApi;