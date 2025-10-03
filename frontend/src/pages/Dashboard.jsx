// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Dashboard() {
  const [eventos, setEventos] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) return;
    // lista todos os eventos do serviço 2 e filtra pelo usuario_id
    (async () => {
      try {
        const res = await api.get("/eventos", { baseURL: import.meta.env.VITE_API_URL?.replace("/login","") || undefined });
        // OBS: se api.baseURL aponta para serviço1, altere para chamar serviço2 diretamente
        // aqui fazemos uma suposição: VITE_API_URL aponta para serviço1 — então chamamos serviço2 pela URL completa
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user]);

  // Simples UI com botão logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bem-vindo, {user?.nome}</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded">Sair</button>
      </div>

      <p>Aqui lista de eventos (implemente a busca a seguir conforme sua arquitetura de serviços).</p>

      {/* TODO: implementar listagem real chamando o serviço de eventos */}
    </div>
  );
}
