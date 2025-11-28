import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle, PartyPopper } from "lucide-react";
import { authService } from "../api/apiService";
import logo from "../assets/logo.png";
import Button from "../components/Button";
import Input from "../components/Input";

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
      await authService.register(nome, email, senha);
      setSucesso("Conta criada com sucesso! Faça login");
      setModoCadastro(false);
      limparCampos();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Erro ao cadastrar.";
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
      await authService.login(email, senha);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.error || "Erro no login. Verifique suas credenciais.";
      setErro(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Lado esquerdo - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-primary-800/90 to-primary-900/90"></div>

        <div className="relative z-10 flex flex-col justify-center p-16 w-full h-full">
          <div className="mb-8">
            <img src={logo} alt="Agenda Logo" className="w-20 h-20 mb-6 drop-shadow-lg" />
            <h1 className="text-5xl font-bold text-white font-heading mb-6 leading-tight">
              Organize sua vida <br />
              <span className="text-primary-300">com inteligência</span>
            </h1>
            <p className="text-xl text-primary-100 leading-relaxed max-w-lg">
              A plataforma completa para gerenciar seus compromissos, compartilhar agendas e aumentar a produtividade da sua equipe.
            </p>
          </div>
        </div>
      </div>

      {/* Lado direito - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 font-heading">
              {modoCadastro ? "Criar nova conta" : "Bem-vindo de volta"}
            </h2>
            <p className="mt-2 text-gray-600">
              {modoCadastro
                ? "Comece a organizar sua agenda hoje mesmo"
                : "Entre para acessar seus compromissos"
              }
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
            {erro && (
              <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg flex items-center animate-fade-in">
                <AlertCircle className="mr-2 w-5 h-5" /> {erro}
              </div>
            )}
            {sucesso && (
              <div className="mb-6 p-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg flex items-center animate-fade-in">
                <CheckCircle className="mr-2 w-5 h-5" /> {sucesso}
              </div>
            )}

            <form onSubmit={modoCadastro ? handleCadastro : handleLogin} className="space-y-5">
              {modoCadastro && (
                <Input
                  label="Nome completo"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Seu nome"
                />
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />

              <Input
                label="Senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
              />

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full h-12 text-lg"
              >
                {modoCadastro ? "Criar conta gratuita" : "Entrar na plataforma"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                {modoCadastro ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
                <button
                  onClick={() => {
                    setModoCadastro(!modoCadastro);
                    setErro("");
                    setSucesso("");
                  }}
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {modoCadastro ? "Fazer login" : "Criar conta grátis"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
