import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  authService, 
  eventService, 
  participationService 
} from "../api/apiService";
import EventCard from "../components/EventCard";
import InviteCard from "../components/InviteCard";
import Modal from "../components/Modal";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Estado do usuário
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Estados de dados
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [acceptedEvents, setAcceptedEvents] = useState([]);
  const [invites, setInvites] = useState([]);
  const [users, setUsers] = useState([]);
  const [participants, setParticipants] = useState([]);
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState("all"); // all, my, accepted, invites
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Estados de modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  
  // Estados de formulários
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: ""
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Inicialização
  useEffect(() => {
    const userString = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (!userString || !token) {
      navigate("/");
      return;
    }
    
    try {
      const userData = JSON.parse(userString);
      setUser(userData);
      setUserId(userData.id);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      navigate("/");
    }
  }, [navigate]);

  // Carrega dados quando o userId está disponível
  useEffect(() => {
    if (userId) {
      loadAllData();
    }
  }, [userId]);

  // Função para carregar todos os dados
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadEvents(),
        loadInvites(),
        loadAcceptedEvents(),
        loadUsers()
      ]);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar todos os eventos
  const loadEvents = async () => {
    try {
      const data = await eventService.getAllEvents();
      setEvents(data);
      // Filtra eventos do usuário atual
      const myEventsFiltered = data.filter(e => e.organizer_id === userId);
      setMyEvents(myEventsFiltered);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      setError("Erro ao carregar eventos");
    }
  };

  // Carregar convites pendentes
  const loadInvites = async () => {
    try {
      const data = await participationService.getUserInvites(userId);
      setInvites(data);
    } catch (err) {
      console.error("Erro ao carregar convites:", err);
    }
  };

  // Carregar eventos aceitos
  const loadAcceptedEvents = async () => {
    try {
      const data = await participationService.getUserAcceptedEvents(userId);
      setAcceptedEvents(data);
    } catch (err) {
      console.error("Erro ao carregar eventos aceitos:", err);
    }
  };

  // Carregar lista de usuários
  const loadUsers = async () => {
    try {
      const data = await authService.getAllUsers();
      // Remove o usuário atual da lista
      const filteredUsers = data.filter(u => u.id !== userId);
      setUsers(filteredUsers);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  };

  // Criar evento
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await eventService.createEvent(
        eventForm.title,
        eventForm.description,
        eventForm.start_time,
        eventForm.end_time,
        userId
      );
      
      setSuccess("Evento criado com sucesso!");
      setShowCreateModal(false);
      setEventForm({ title: "", description: "", start_time: "", end_time: "" });
      await loadEvents();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao criar evento";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar evento
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await eventService.updateEvent(
        editingEvent.id,
        eventForm.title,
        eventForm.description,
        eventForm.start_time,
        eventForm.end_time
      );
      
      setSuccess("Evento atualizado com sucesso!");
      setShowEditModal(false);
      setEditingEvent(null);
      setEventForm({ title: "", description: "", start_time: "", end_time: "" });
      await loadEvents();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao atualizar evento";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Deletar evento
  const handleDeleteEvent = async (event) => {
    if (!window.confirm(`Tem certeza que deseja deletar o evento "${event.title}"?`)) {
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await eventService.deleteEvent(event.id);
      setSuccess("Evento deletado com sucesso!");
      await loadEvents();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao deletar evento";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de edição
  const openEditModal = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || "",
      start_time: event.start_time ? event.start_time.slice(0, 16) : "",
      end_time: event.end_time ? event.end_time.slice(0, 16) : ""
    });
    setShowEditModal(true);
  };

  // Abrir modal de convite
  const openInviteModal = (event) => {
    setSelectedEvent(event);
    setSelectedUsers([]);
    setShowInviteModal(true);
  };

  // Enviar convites
  const handleSendInvites = async () => {
    if (selectedUsers.length === 0) {
      setError("Selecione pelo menos um usuário para convidar");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await eventService.inviteUsers(selectedEvent.id, selectedUsers);
      setSuccess(`${selectedUsers.length} convite(s) enviado(s) com sucesso!`);
      setShowInviteModal(false);
      setSelectedUsers([]);
      setSelectedEvent(null);
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao enviar convites";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Ver participantes
  const handleViewParticipants = async (event) => {
    setSelectedEvent(event);
    setLoading(true);
    
    try {
      const data = await eventService.getEventParticipants(event.id);
      setParticipants(data);
      setShowParticipantsModal(true);
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao carregar participantes";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Aceitar convite
  const handleAcceptInvite = async (invite) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await participationService.updateParticipationStatus(
        invite.participation_id,
        "accepted"
      );
      setSuccess("Convite aceito com sucesso!");
      await loadInvites();
      await loadAcceptedEvents();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao aceitar convite";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Recusar convite
  const handleDeclineInvite = async (invite) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await participationService.updateParticipationStatus(
        invite.participation_id,
        "declined"
      );
      setSuccess("Convite recusado");
      await loadInvites();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao recusar convite";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  // Toggle seleção de usuário
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agenda Compartilhada</h1>
              <p className="text-sm text-gray-600">Bem-vindo, {user?.email || "Usuário"}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
              >
                + Novo Evento
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mensagens */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("all")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "all"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Todos os Eventos ({events.length})
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "my"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Meus Eventos ({myEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("accepted")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "accepted"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Eventos Aceitos ({acceptedEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("invites")}
              className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === "invites"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Convites Pendentes ({invites.length})
              {invites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {invites.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        )}

        {!loading && activeTab === "all" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-12">
                Nenhum evento cadastrado ainda. Crie o primeiro!
              </p>
            ) : (
              events.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  isOrganizer={event.organizer_id === userId}
                  onEdit={openEditModal}
                  onDelete={handleDeleteEvent}
                  onInvite={openInviteModal}
                  onViewParticipants={handleViewParticipants}
                />
              ))
            )}
          </div>
        )}

        {!loading && activeTab === "my" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-12">
                Você ainda não criou nenhum evento. Clique em "Novo Evento" para começar!
              </p>
            ) : (
              myEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  isOrganizer={true}
                  onEdit={openEditModal}
                  onDelete={handleDeleteEvent}
                  onInvite={openInviteModal}
                  onViewParticipants={handleViewParticipants}
                />
              ))
            )}
          </div>
        )}

        {!loading && activeTab === "accepted" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedEvents.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-12">
                Você ainda não aceitou nenhum convite de evento.
              </p>
            ) : (
              acceptedEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  isOrganizer={event.organizer_id === userId}
                  onEdit={openEditModal}
                  onDelete={handleDeleteEvent}
                  onInvite={openInviteModal}
                  onViewParticipants={handleViewParticipants}
                />
              ))
            )}
          </div>
        )}

        {!loading && activeTab === "invites" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invites.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-12">
                Você não tem convites pendentes no momento.
              </p>
            ) : (
              invites.map(invite => (
                <InviteCard
                  key={invite.participation_id}
                  invite={invite}
                  onAccept={handleAcceptInvite}
                  onDecline={handleDeclineInvite}
                />
              ))
            )}
          </div>
        )}
      </main>

      {/* Modal Criar Evento */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEventForm({ title: "", description: "", start_time: "", end_time: "" });
        }}
        title="Criar Novo Evento"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nome do evento"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva o evento"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data e Hora de Início *
            </label>
            <input
              type="datetime-local"
              value={eventForm.start_time}
              onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data e Hora de Fim *
            </label>
            <input
              type="datetime-local"
              value={eventForm.end_time}
              onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Evento"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setEventForm({ title: "", description: "", start_time: "", end_time: "" });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Evento */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEvent(null);
          setEventForm({ title: "", description: "", start_time: "", end_time: "" });
        }}
        title="Editar Evento"
      >
        <form onSubmit={handleUpdateEvent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data e Hora de Início *
            </label>
            <input
              type="datetime-local"
              value={eventForm.start_time}
              onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data e Hora de Fim *
            </label>
            <input
              type="datetime-local"
              value={eventForm.end_time}
              onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingEvent(null);
                setEventForm({ title: "", description: "", start_time: "", end_time: "" });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Convidar Usuários */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setSelectedEvent(null);
          setSelectedUsers([]);
        }}
        title={`Convidar usuários para: ${selectedEvent?.title || ""}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecione os usuários que deseja convidar para este evento:
          </p>

          <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-4">
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum outro usuário cadastrado no sistema.
              </p>
            ) : (
              users.map(user => (
                <label
                  key={user.id}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-md cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">{user.email}</span>
                </label>
              ))
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSendInvites}
              disabled={loading || selectedUsers.length === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold disabled:opacity-50"
            >
              {loading ? "Enviando..." : `Enviar Convites (${selectedUsers.length})`}
            </button>
            <button
              onClick={() => {
                setShowInviteModal(false);
                setSelectedEvent(null);
                setSelectedUsers([]);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Participantes */}
      <Modal
        isOpen={showParticipantsModal}
        onClose={() => {
          setShowParticipantsModal(false);
          setSelectedEvent(null);
          setParticipants([]);
        }}
        title={`Participantes: ${selectedEvent?.title || ""}`}
      >
        <div className="space-y-4">
          {participants.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum participante neste evento ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {participants.map(participant => (
                <div
                  key={participant.participation_id}
                  className="flex justify-between items-center p-3 border rounded-md"
                >
                  <div>
                    <p className="font-medium text-gray-900">{participant.email}</p>
                    <p className="text-xs text-gray-500">ID: {participant.id}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      participant.status === "accepted"
                        ? "bg-green-100 text-green-700"
                        : participant.status === "declined"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {participant.status === "accepted"
                      ? "Confirmado"
                      : participant.status === "declined"
                      ? "Recusou"
                      : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={() => {
                setShowParticipantsModal(false);
                setSelectedEvent(null);
                setParticipants([]);
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
