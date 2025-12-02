import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Building2, ArrowLeft } from "lucide-react";
import { authService } from "../api/apiService";
import logo from "../assets/logo.png";
import Button from "../components/Button";
import Input from "../components/Input";

export default function RegisterCompany() {
    const [nomeEmpresa, setNomeEmpresa] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleCadastro = async (e) => {
        e.preventDefault();
        setErro("");
        setIsLoading(true);

        try {
            await authService.registerCompany(nomeEmpresa, email, senha);
            // Após cadastro, redireciona para login com mensagem de sucesso (poderia ser automático, mas login é mais seguro)
            navigate("/", {
                state: { message: "Empresa registrada com sucesso! Faça login para continuar." }
            });
        } catch (err) {
            const msg = err.response?.data?.error || err.message || "Erro ao registrar empresa.";
            setErro(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <img src={logo} alt="Agenda Logo" className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
                    <h2 className="text-3xl font-bold text-gray-900 font-heading">
                        Cadastre sua Empresa
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Comece a gerenciar sua equipe e eventos hoje mesmo
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
                    {erro && (
                        <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg flex items-center animate-fade-in">
                            <AlertCircle className="mr-2 w-5 h-5" /> {erro}
                        </div>
                    )}

                    <form onSubmit={handleCadastro} className="space-y-5">
                        <Input
                            label="Nome da Empresa"
                            type="text"
                            value={nomeEmpresa}
                            onChange={(e) => setNomeEmpresa(e.target.value)}
                            required
                            placeholder="Minha Empresa Ltda"
                            icon={<Building2 className="w-5 h-5 text-gray-400" />}
                        />

                        <Input
                            label="Email do Administrador"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@empresa.com"
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
                            Criar conta empresarial
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <button
                            onClick={() => navigate("/register")}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar para seleção
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
