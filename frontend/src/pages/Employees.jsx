import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { authService, participationService } from '../api/apiService';
import { useNavigate } from 'react-router-dom';

export default function Employees() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal de criação
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [employeeForm, setEmployeeForm] = useState({
        nome: "",
        email: "",
        senha: ""
    });

    // Modal de visualização de eventos
    const [showEventsModal, setShowEventsModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeeEvents, setEmployeeEvents] = useState({ invites: [], accepted: [] });
    const [loadingEvents, setLoadingEvents] = useState(false);

    useEffect(() => {
        const userString = localStorage.getItem("user");
        if (!userString) {
            navigate("/");
            return;
        }
        const userData = JSON.parse(userString);
        setUser(userData);

        if (!userData.isOwner) {
            navigate("/dashboard");
            return;
        }

        if (!userData.empresa_id) {
            setError("Erro: Identificação da empresa não encontrada. Tente fazer login novamente.");
            return;
        }

        loadEmployees(userData.empresa_id);
    }, [navigate]);

    const loadEmployees = async (empresaId) => {
        setLoading(true);
        try {
            const data = await authService.getCompanyUsers(empresaId);
            setEmployees(data);
        } catch (err) {
            console.error("Erro ao carregar funcionários:", err);
            const msg = err.response?.data?.error || "Erro ao carregar lista de funcionários.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await authService.createEmployee(employeeForm.nome, employeeForm.email, employeeForm.senha);
            setSuccess("Funcionário criado com sucesso!");
            setShowCreateModal(false);
            setEmployeeForm({ nome: "", email: "", senha: "" });
            if (user?.empresa_id) {
                await loadEmployees(user.empresa_id);
            }
        } catch (err) {
            const msg = err.response?.data?.error || "Erro ao criar funcionário";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        if (!window.confirm("Tem certeza que deseja remover este funcionário?")) {
            return;
        }

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await authService.deleteEmployee(employeeId);
            setSuccess("Funcionário removido com sucesso!");
            if (user?.empresa_id) {
                await loadEmployees(user.empresa_id);
            }
        } catch (err) {
            const msg = err.response?.data?.error || "Erro ao remover funcionário";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleViewEvents = async (employee) => {
        setSelectedEmployee(employee);
        setShowEventsModal(true);
        setLoadingEvents(true);
        try {
            const [invites, accepted] = await Promise.all([
                participationService.getUserInvites(employee.id),
                participationService.getUserAcceptedEvents(employee.id)
            ]);
            setEmployeeEvents({ invites, accepted });
        } catch (err) {
            console.error("Erro ao carregar eventos do funcionário:", err);
            // Não mostra erro global, apenas no console, pois o modal já abriu
        } finally {
            setLoadingEvents(false);
        }
    };

    return (
        <Layout
            user={user}
            title="Gestão de Funcionários"
            actions={
                <Button onClick={() => setShowCreateModal(true)}>
                    + Novo Funcionário
                </Button>
            }
        >
            {(error || success) && (
                <div className="mb-6 animate-fade-in">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            {success}
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
            ) : employees.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">Nenhum funcionário encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map(emp => (
                        <div key={emp.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                                    {emp.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate" title={emp.email}>{emp.email}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${emp.is_owner ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {emp.is_owner ? 'Dono (Você)' : 'Funcionário'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                                {!emp.is_owner && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="flex-1 text-xs"
                                            onClick={() => handleViewEvents(emp)}
                                        >
                                            Ver Agenda
                                        </Button>
                                        <button
                                            onClick={() => handleDeleteEmployee(emp.id)}
                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remover funcionário"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                                {emp.is_owner && (
                                    <p className="text-xs text-gray-400 italic w-full text-center">Administrador da conta</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Criar Funcionário */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Cadastrar Funcionário"
            >
                <form onSubmit={handleCreateEmployee} className="space-y-6">
                    <Input
                        label="Nome Completo"
                        value={employeeForm.nome}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, nome: e.target.value })}
                        required
                        placeholder="Nome do funcionário"
                    />
                    <Input
                        label="Email Corporativo"
                        type="email"
                        value={employeeForm.email}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                        required
                        placeholder="funcionario@empresa.com"
                    />
                    <Input
                        label="Senha Inicial"
                        type="password"
                        value={employeeForm.senha}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, senha: e.target.value })}
                        required
                        placeholder="••••••••"
                    />
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={loading} className="flex-1">
                            Criar Credencial
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Visualizar Eventos */}
            <Modal
                isOpen={showEventsModal}
                onClose={() => setShowEventsModal(false)}
                title={`Agenda de ${selectedEmployee?.email}`}
            >
                {loadingEvents ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Reuniões Confirmadas
                            </h4>
                            {employeeEvents.accepted.length === 0 ? (
                                <p className="text-sm text-gray-500 pl-4">Nenhuma reunião confirmada.</p>
                            ) : (
                                <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                                    {employeeEvents.accepted.map(evt => (
                                        <div key={evt.id} className="text-sm">
                                            <p className="font-medium text-gray-800">{evt.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(evt.start_time).toLocaleDateString()} às {new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                Convites Pendentes
                            </h4>
                            {employeeEvents.invites.length === 0 ? (
                                <p className="text-sm text-gray-500 pl-4">Nenhum convite pendente.</p>
                            ) : (
                                <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                                    {employeeEvents.invites.map(evt => (
                                        <div key={evt.id} className="text-sm">
                                            <p className="font-medium text-gray-800">{evt.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(evt.start_time).toLocaleDateString()} às {new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}
