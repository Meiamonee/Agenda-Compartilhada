import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setIsLoading(true);

    try {
      // Adapte esta linha para o caminho correto do seu backend
      const res = await api.post("/login", { email, senha }); 
      
      const user = res.data.user;
      if (!user) throw new Error("Resposta inválida do servidor");

      localStorage.setItem("user", JSON.stringify(user));
      
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || "Erro no login. Verifique suas credenciais.";
      setErro(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Layout estilizado com Tailwind
  return (
    // Container Principal: min-h-screen e flex garantem que ele ocupe 100% da altura da viewport.
    <div className="min-h-screen flex bg-gray-50">
      
      {/* Lado Esquerdo - Hero Section (Degradê Azul) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
          <div className="absolute inset-0 opacity-10">
            {/* Padrões Geométricos */}
            <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-lg rotate-12"></div>
            <div className="absolute top-40 right-32 w-24 h-24 border border-white/15 rounded-lg -rotate-6"></div>
            <div className="absolute bottom-32 left-32 w-40 h-40 border border-white/10 rounded-lg rotate-45"></div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center p-12 w-full">
          <div className="text-white max-w-md space-y-8">
            <div className="flex items-center space-x-3 mb-8">
              <h1 className="text-2xl font-bold">Agenda Online</h1>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold leading-tight">
                Organize sua agenda de forma inteligente
              </h2>
              <p className="text-lg text-blue-100 leading-relaxed">
                Compartilhe compromissos com sua equipe, sincronize calendários e aumente sua produtividade com nossa plataforma colaborativa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login (Centralizado Corrigido) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 p-8 bg-white shadow-xl rounded-lg border border-gray-200">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">
              Bem-vindo 
            </h2>
            <p className="text-gray-600">
              Entre com suas credenciais para acessar sua agenda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {erro && (
              <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <span>{erro}</span>
              </div>
            )}

            {/* Campo Email - CORRIGIDO: text-gray-900 para visibilidade */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Endereço de email</label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                // Corrigido: text-gray-900 para garantir que o texto digitado apareça escuro
                className="w-full h-12 px-3 py-2 text-base border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Campo Senha - CORRIGIDO: text-gray-900 para visibilidade */}
            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm font-medium text-gray-700">Senha</label>
              <input
                id="senha"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                // Corrigido: text-gray-900 para garantir que o texto digitado apareça escuro
                className="w-full h-12 px-3 py-2 text-base border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">
                Esqueceu sua senha?
              </a>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </div>
              ) : (
                "Entrar na sua conta"
              )}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{" "}
              <a href="#" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">
                Criar conta gratuita
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}