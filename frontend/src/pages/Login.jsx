// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      const res = await api.post("/login", { email, senha });
      // seu backend retorna: { message: "...", user: { id, nome, email } }
      const user = res.data.user;
      if (!user) throw new Error("Resposta inválida do servidor");

      // salvar info do usuário (como não há JWT ainda, guardamos user)
      localStorage.setItem("user", JSON.stringify(user));

      // redirecionar para dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || "Erro no login";
      setErro(msg);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Entrar</h1>

        {erro && <div className="mb-4 text-center text-red-600">{erro}</div>}

        <label className="block mb-2 text-sm font-medium">Email</label>
        <input
          type="email"
          className="w-full mb-4 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block mb-2 text-sm font-medium">Senha</label>
        <input
          type="password"
          className="w-full mb-4 p-2 border rounded"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <button className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700" type="submit">
          Entrar
        </button>
      </form>
    </div>
  );
}
