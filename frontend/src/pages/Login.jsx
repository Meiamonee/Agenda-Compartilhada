import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modoCadastro, setModoCadastro] = useState(false);
  const navigate = useNavigate();

  const limparCampos = () => {
    setEmail("");
    setSenha("");
    setNome("");
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setIsLoading(true);

    try {
      const res = await api.post("/usuarios", { nome, email, senha });
      setSucesso("Conta criada com sucesso! Faça login 🎉");

      // volta pro login
      setModoCadastro(false);
      limparCampos();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao cadastrar.";
      setErro(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setIsLoading(true);

    try {
      const res = await api.post("/login", { email, senha });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.error || "Erro no login. Verifique suas credenciais.";
      setErro(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Lado esquerdo igual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-lg rotate-12"></div>
            <div className="absolute top-40 right-32 w-24 h-24 border border-white/15 rounded-lg -rotate-6"></div>
            <div className="absolute bottom-32 left-32 w-40 h-40 border border-white/10 rounded-lg rotate-45"></div>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-center p-12 w-full">
          <div className="text-white max-w-md space-y-8">
            <h1 className="text-2xl font-bold">Agenda Online</h1>
            <h2 className="text-4xl font-bold leading-tight">
              Organize sua agenda de forma inteligente
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed">
              Compartilhe compromissos com sua equipe, sincronize calendários e aumente sua produtividade.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 p-8 bg-white shadow-xl rounded-lg border border-gray-200">

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">
              {modoCadastro ? "Criar conta" : "Bem-vindo"}
            </h2>
            <p className="text-gray-600">
              {modoCadastro 
                ? "Preencha para criar sua conta"
                : "Entre com suas credenciais"
              }
            </p>
          </div>

          {erro && (
            <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{erro}</div>
          )}
          {sucesso && (
            <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">{sucesso}</div>
          )}

          <form onSubmit={modoCadastro ? handleCadastro : handleLogin} className="space-y-6">
            
            {modoCadastro && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full h-12 px-3 border rounded-md text-gray-900"
                  placeholder="Seu nome"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-3 border rounded-md text-gray-900"
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full h-12 px-3 border rounded-md text-gray-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold disabled:opacity-50"
            >
              {isLoading ? "Processando..." : modoCadastro ? "Criar conta" : "Entrar"}
            </button>
          </form>

          <div className="text-center pt-4 border-t">
            {modoCadastro ? (
              <p className="text-sm">
                Já tem conta?{" "}
                <button
                  onClick={() => { setModoCadastro(false); setErro(""); setSucesso(""); }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Fazer login
                </button>
              </p>
            ) : (
              <p className="text-sm">
                Não tem uma conta?{" "}
                <button
                  onClick={() => { setModoCadastro(true); setErro(""); setSucesso(""); }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Criar conta gratuita
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
