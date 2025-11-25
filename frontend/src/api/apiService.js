import axios from "axios";

// URLs das APIs
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:3001";
const EVENTS_API_URL = import.meta.env.VITE_EVENTS_API_URL || "http://localhost:3002";

// Instâncias do Axios
const authApi = axios.create({
  baseURL: AUTH_API_URL,
});

const eventsApi = axios.create({
  baseURL: EVENTS_API_URL,
});

// Interceptor para adicionar token JWT automaticamente
const addAuthInterceptor = (apiInstance) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor para lidar com erros de autenticação
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Token expirado ou inválido - redireciona para login
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/";
      }
      return Promise.reject(error);
    }
  );
};

// Adiciona interceptors
addAuthInterceptor(authApi);
addAuthInterceptor(eventsApi);

// ==================== SERVIÇOS DE AUTENTICAÇÃO ====================

export const authService = {
  // Registrar novo usuário
  async register(nome, email, senha) {
    const response = await authApi.post("/usuarios", { nome, email, senha });
    return response.data;
  },

  // Fazer login
  async login(email, senha) {
    const response = await authApi.post("/login", { email, senha });
    const { user, token } = response.data;
    
    // Salva token e usuário no localStorage
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    
    return response.data;
  },

  // Logout
  logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  },

  // Buscar todos os usuários (para convidar)
  async getAllUsers() {
    const response = await authApi.get("/usuarios");
    return response.data;
  },

  // Buscar usuário por ID
  async getUserById(id) {
    const response = await authApi.get(`/usuarios/${id}`);
    return response.data;
  }
};

// ==================== SERVIÇOS DE EVENTOS ====================

export const eventService = {
  // Criar novo evento
  async createEvent(title, description, start_time, end_time, organizer_id) {
    const response = await eventsApi.post("/eventos", {
      title,
      description,
      start_time,
      end_time,
      organizer_id
    });
    return response.data;
  },

  // Listar todos os eventos
  async getAllEvents() {
    const response = await eventsApi.get("/eventos");
    return response.data;
  },

  // Atualizar evento
  async updateEvent(id, title, description, start_time, end_time) {
    const response = await eventsApi.put(`/eventos/${id}`, {
      title,
      description,
      start_time,
      end_time
    });
    return response.data;
  },

  // Deletar evento
  async deleteEvent(id) {
    const response = await eventsApi.delete(`/eventos/${id}`);
    return response.data;
  },

  // Enviar convites para um evento
  async inviteUsers(eventoId, userIds) {
    const response = await eventsApi.post(`/eventos/${eventoId}/convidar`, {
      user_ids: userIds
    });
    return response.data;
  },

  // Listar participantes de um evento
  async getEventParticipants(eventoId) {
    const response = await eventsApi.get(`/eventos/${eventoId}/participantes`);
    return response.data;
  }
};

// ==================== SERVIÇOS DE PARTICIPAÇÃO ====================

export const participationService = {
  // Aceitar/Recusar convite
  async updateParticipationStatus(participationId, status) {
    const response = await eventsApi.put(`/participations/${participationId}`, {
      status
    });
    return response.data;
  },

  // Listar convites pendentes do usuário
  async getUserInvites(userId) {
    const response = await eventsApi.get(`/usuarios/${userId}/convites`);
    return response.data;
  },

  // Listar eventos aceitos do usuário
  async getUserAcceptedEvents(userId) {
    const response = await eventsApi.get(`/usuarios/${userId}/aceitos`);
    return response.data;
  }
};

// Exporta as instâncias também para uso direto
export { authApi, eventsApi };

