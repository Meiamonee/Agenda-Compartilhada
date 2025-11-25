import axios from "axios";

// URLs das APIs
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:3001";
const EVENTS_API_URL = import.meta.env.VITE_EVENTS_API_URL || "http://localhost:3002";

// Debug: Mostrar configurações no console
console.log("🔧 [CONFIG] URLs das APIs:");
console.log("  - AUTH_API_URL:", AUTH_API_URL);
console.log("  - EVENTS_API_URL:", EVENTS_API_URL);
console.log("  - Variáveis de ambiente:", import.meta.env);

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
      console.log("🔵 [INTERCEPTOR] Fazendo requisição:", config.method?.toUpperCase(), config.url);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔵 [INTERCEPTOR] Token adicionado ao header");
      } else {
        console.log("⚠️ [INTERCEPTOR] Sem token - requisição pública");
      }
      return config;
    },
    (error) => {
      console.error("❌ [INTERCEPTOR] Erro na requisição:", error);
      return Promise.reject(error);
    }
  );

  // Interceptor para lidar com erros de autenticação
  apiInstance.interceptors.response.use(
    (response) => {
      console.log("✅ [INTERCEPTOR] Resposta recebida:", response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error("❌ [INTERCEPTOR] Erro na resposta:", {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn("⚠️ [INTERCEPTOR] Token inválido - redirecionando para login");
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
    console.log("🔵 [DEBUG] Tentando registrar usuário:", { nome, email });
    console.log("🔵 [DEBUG] URL da API:", AUTH_API_URL);
    
    try {
      const response = await authApi.post("/usuarios", { nome, email, senha });
      console.log("✅ [DEBUG] Registro bem-sucedido:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [DEBUG] Erro no registro:", error);
      console.error("❌ [DEBUG] Erro response:", error.response);
      console.error("❌ [DEBUG] Erro data:", error.response?.data);
      console.error("❌ [DEBUG] Status:", error.response?.status);
      throw error;
    }
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
  async createEvent(title, description, start_time, end_time, organizer_id, is_public = true) {
    const response = await eventsApi.post("/eventos", {
      title,
      description,
      start_time,
      end_time,
      organizer_id,
      is_public
    });
    return response.data;
  },

  // Listar todos os eventos
  async getAllEvents() {
    const response = await eventsApi.get("/eventos");
    return response.data;
  },

  // Atualizar evento
  async updateEvent(id, title, description, start_time, end_time, is_public = true) {
    const response = await eventsApi.put(`/eventos/${id}`, {
      title,
      description,
      start_time,
      end_time,
      is_public
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
  },

  // Participar de um evento
  async joinEvent(eventoId) {
    console.log("🔵 [DEBUG] Participando do evento:", eventoId);
    const response = await eventsApi.post(`/eventos/${eventoId}/participar`);
    console.log("✅ [DEBUG] Participação confirmada:", response.data);
    return response.data;
  },

  // Sair de um evento
  async leaveEvent(eventoId) {
    console.log("🔵 [DEBUG] Saindo do evento:", eventoId);
    const response = await eventsApi.delete(`/eventos/${eventoId}/sair`);
    console.log("✅ [DEBUG] Saída confirmada:", response.data);
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

