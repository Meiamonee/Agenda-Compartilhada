import axios from "axios";

const api = axios.create({
  baseURL: "https://agenda-compartilhada-1.onrender.com", // 👉 serviço de usuários
});

export default api;
