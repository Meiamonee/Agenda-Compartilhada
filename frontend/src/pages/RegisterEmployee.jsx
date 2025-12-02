import { useNavigate } from "react-router-dom";
import { User, ArrowLeft, LogIn } from "lucide-react";
import logo from "../assets/logo.png";
import Button from "../components/Button";

export default function RegisterEmployee() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 text-center">
                <img src={logo} alt="Agenda Logo" className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />

                <div className="w-16 h-16 bg-secondary-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <User className="w-8 h-8 text-secondary-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 font-heading mb-4">
                    Acesso para Funcionários
                </h2>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    Para acessar a plataforma como funcionário, sua conta precisa ser criada pelo <strong>administrador da sua empresa</strong>.
                </p>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-8 text-left">
                    <h4 className="font-semibold text-blue-900 mb-2">Como funciona:</h4>
                    <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
                        <li>O administrador da empresa cria sua conta.</li>
                        <li>Você recebe suas credenciais de acesso.</li>
                        <li>Use essas credenciais para fazer login.</li>
                    </ol>
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={() => navigate("/")}
                        className="w-full h-12 text-lg flex items-center justify-center"
                    >
                        <LogIn className="w-5 h-5 mr-2" />
                        Fazer Login
                    </Button>

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
    );
}
