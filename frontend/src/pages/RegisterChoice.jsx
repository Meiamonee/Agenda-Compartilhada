import { useNavigate } from "react-router-dom";
import { Building2, User, ArrowLeft } from "lucide-react";
import logo from "../assets/logo.png";

export default function RegisterChoice() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <img src={logo} alt="Agenda Logo" className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
                    <h1 className="text-4xl font-bold text-gray-900 font-heading mb-4">
                        Como você deseja usar a plataforma?
                    </h1>
                    <p className="text-xl text-gray-600">
                        Escolha o tipo de conta que melhor se adapta às suas necessidades
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* Opção Empresa */}
                    <button
                        onClick={() => navigate("/register/company")}
                        className="group relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary-500 text-left"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Building2 className="w-32 h-32 text-primary-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Building2 className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Sou uma Empresa</h3>
                            <p className="text-gray-600 mb-6">
                                Quero gerenciar minha equipe, criar eventos e organizar a agenda da minha organização.
                            </p>
                            <span className="inline-flex items-center text-primary-600 font-semibold group-hover:translate-x-2 transition-transform">
                                Criar conta empresarial →
                            </span>
                        </div>
                    </button>

                    {/* Opção Funcionário */}
                    <button
                        onClick={() => navigate("/register/employee")}
                        className="group relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-secondary-500 text-left"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <User className="w-32 h-32 text-secondary-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-secondary-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <User className="w-8 h-8 text-secondary-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Sou Funcionário</h3>
                            <p className="text-gray-600 mb-6">
                                Faço parte de uma equipe e quero acessar minha agenda e compromissos.
                            </p>
                            <span className="inline-flex items-center text-secondary-600 font-semibold group-hover:translate-x-2 transition-transform">
                                Acessar como funcionário →
                            </span>
                        </div>
                    </button>
                </div>

                <div className="text-center mt-12">
                    <button
                        onClick={() => navigate("/")}
                        className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para o login
                    </button>
                </div>
            </div>
        </div>
    );
}
