import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  authService,
  eventService,
  participationService,
  notificationService
} from "../api/apiService";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Input from "../components/Input";
import EventCard from "../components/EventCard";
import InviteCard from "../components/InviteCard";
import NotificationCard from "../components/NotificationCard";
import Modal from "../components/Modal";
import Calendar from "../components/Calendar";
import CalendarView from "../components/CalendarView";
import ChatWidget from "../components/ChatWidget";

export default function Dashboard({ initialView = "list" }) {
  const navigate = useNavigate();

  // Estado do usuário
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);

  // Estados de dados
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [acceptedEvents, setAcceptedEvents] = useState([]);
  const [invites, setInvites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [companyUsers, setCompanyUsers] = useState([]); // Novos usuários da empresa
  const [participants, setParticipants] = useState([]);

  // Estados de UI
  const [activeTab, setActiveTab] = useState("all"); // all, my, accepted, invites, employees
  const [viewMode, setViewMode] = useState(initialView); // list, calendar
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Estados de modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false); // Modal de funcionário

  // Estados de formulários
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    is_public: true
  });
  const [employeeForm, setEmployeeForm] = useState({ // Form de funcionário
    nome: "",
    email: "",
    senha: ""
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

  // Atualiza o modo de visualização se a prop mudar
  useEffect(() => {
    setViewMode(initialView);
  }, [initialView]);

  // Função para carregar todos os dados
  const loadAllData = async () => {
    setLoading(true);
    try {
      const promises = [
        loadEvents(),
        loadInvites(),
        loadNotifications(),
        loadAcceptedEvents(),
        loadUsers()
      ];

      // Se for dono, carrega funcionários da empresa
      if (user?.isOwner && user?.empresa_id) {
        promises.push(loadCompanyUsers(user.empresa_id));
      }

      await Promise.all(promises);
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

  // Carregar notificações
  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
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

  // Carregar lista de usuários (para convites)
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

  // Carregar usuários da empresa (para gestão)
  const loadCompanyUsers = async (empresaId) => {
    try {
      const data = await authService.getCompanyUsers(empresaId);
      setCompanyUsers(data);
    } catch (err) {
      console.error("Erro ao carregar funcionários:", err);
    }
  };

  // Criar evento
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Combinar data e hora em formato ISO
      const startDateTime = `${eventForm.start_date}T${eventForm.start_time}:00`;

      // Criar data de fim (1 hora depois por padrão)
      const startDate = new Date(startDateTime);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hora
      const endDateTime = endDate.toISOString();

      // Criar o evento
      const newEvent = await eventService.createEvent(
        eventForm.title,
        eventForm.description,
        startDateTime,
        endDateTime,
        userId,
        eventForm.is_public
      );

      // Se há usuários selecionados, enviar convites
      if (selectedUsers.length > 0) {
        try {
          await eventService.inviteUsers(newEvent.id, selectedUsers);
          setSuccess(`Evento criado e ${selectedUsers.length} convite(s) enviado(s)!`);
        } catch (inviteErr) {
          console.error("Erro ao enviar convites:", inviteErr);
          setSuccess("Evento criado, mas houve erro ao enviar alguns convites.");
        }
      } else {
        setSuccess("Evento criado com sucesso!");
      }

      setShowCreateModal(false);
      setEventForm({ title: "", description: "", start_date: "", start_time: "", is_public: true });
      setSelectedUsers([]);
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
      // Combinar data e hora e converter para ISO string
      const startDateTime = new Date(`${eventForm.start_date}T${eventForm.start_time}:00`).toISOString();

      // Criar data de fim (1 hora depois)
      const startDate = new Date(startDateTime);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      const endDateTime = endDate.toISOString();

      await eventService.updateEvent(
        editingEvent.id,
        eventForm.title,
        eventForm.description,
        startDateTime,
        endDateTime,
        eventForm.is_public
      );

      setSuccess("Evento atualizado com sucesso!");
      setShowEditModal(false);
      setEditingEvent(null);
      setEventForm({ title: "", description: "", start_date: "", start_time: "", is_public: true });
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

    // Separar data e hora do start_time
    let startDate = "";
    let startTime = "";
    if (event.start_time) {
      const dateObj = new Date(event.start_time);
      startDate = dateObj.toISOString().split('T')[0];
      startTime = dateObj.toTimeString().slice(0, 5);
    }

    setEventForm({
      title: event.title,
      description: event.description || "",
      start_date: startDate,
      start_time: startTime,
      is_public: event.is_public !== false
    });
    setShowEditModal(true);
  };

  // Abrir modal de convite
  const openInviteModal = async (event) => {
    setSelectedEvent(event);
    setSelectedUsers([]);
    setShowInviteModal(true);

    // Carregar participantes atuais
    try {
      const data = await eventService.getEventParticipants(event.id);
      // Map user_email to email for consistency
      const mappedData = data.map(p => ({
        ...p,
        email: p.user_email || p.email
      }));
      setParticipants(mappedData);
    } catch (err) {
      console.error("Erro ao carregar participantes:", err);
    }
  };

  // Toggle seleção de usuário para criar evento
  const toggleUserForCreation = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Convidar usuário individual
  const handleInviteUser = async (user) => {
    setError("");
    setSuccess("");

    try {
      await eventService.inviteUsers(selectedEvent.id, [user.id]);
      setSuccess(`Convite enviado para ${user.email}!`);

      // Atualizar lista de participantes
      if (showParticipantsModal) {
        await handleViewParticipants(selectedEvent);
      }

      // Aguardar um pouco para o usuário ver a mensagem
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao enviar convite";
      setError(msg);

      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };

  // Ver participantes
  const handleViewParticipants = async (event) => {
    setSelectedEvent(event);
    setLoading(true);

    try {
      const data = await eventService.getEventParticipants(event.id);
      // Map user_email to email for consistency
      const mappedData = data.map(p => ({
        ...p,
        email: p.user_email || p.email
      }));
      setParticipants(mappedData);
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

  // Participar de evento
  const handleJoinEvent = async (event) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await eventService.joinEvent(event.id);
      setSuccess("Você está participando do evento!");
      await loadAcceptedEvents();
      await loadAllData();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao participar do evento";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Sair de evento
  const handleLeaveEvent = async (event) => {
    if (!window.confirm(`Tem certeza que deseja sair do evento "${event.title}"?`)) {
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await eventService.leaveEvent(event.id);
      setSuccess("Você saiu do evento.");
      await loadAcceptedEvents();
      await loadAllData();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao sair do evento";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o usuário está participando de um evento
  const isUserParticipating = (eventId) => {
    return acceptedEvents.some(e => e.id === eventId);
  };

  // Verificar se o usuário foi convidado para um evento
  const isUserInvited = (eventId) => {
    return invites.some(e => e.id === eventId) || acceptedEvents.some(e => e.id === eventId);
  };

  // Criar funcionário
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await authService.createEmployee(employeeForm.nome, employeeForm.email, employeeForm.senha);
      setSuccess("Funcionário criado com sucesso!");
      setShowEmployeeModal(false);
      setEmployeeForm({ nome: "", email: "", senha: "" });
      // Recarrega lista de funcionários
      if (user?.empresa_id) {
        await loadCompanyUsers(user.empresa_id);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao criar funcionário";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Deletar funcionário
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
        await loadCompanyUsers(user.empresa_id);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao remover funcionário";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificação como lida
  const handleDismissNotification = async (notification) => {
    try {
      await notificationService.markAsRead(notification.id);
      // Remove da lista localmente
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
    }
  };

  const tabs = [
    { id: "all", label: "Todos os Eventos", count: events.length },
    { id: "my", label: "Meus Eventos", count: myEvents.length },
    { id: "accepted", label: "Confirmados", count: acceptedEvents.length },
    { id: "invites", label: "Notificações", count: invites.length + notifications.length, badge: (invites.length + notifications.length) > 0 },
  ];

  return (
    <Layout
      user={user}
      title="Dashboard"
      actions={
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            + Novo Evento
          </Button>
        </div>
      }
    >
      {/* Feedback Messages */}
      {
        (error || success) && (
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
        )
      }

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex space-x-8 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group relative py-4 px-1 text-sm font-medium transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                <span className={`
                  px-2 py-0.5 rounded-full text-xs
                  ${activeTab === tab.id ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"}
                `}>
                  {tab.count}
                </span>
                {tab.badge && (
                  <span className="absolute top-2 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {
        loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Carregando...</p>
          </div>
        ) : viewMode === "calendar" ? (
          <div className="animate-fade-in">
            <CalendarView
              events={[...events, ...acceptedEvents]}
              onDateClick={(date) => {
                setEventForm(prev => ({ ...prev, start_date: date.toISOString().split('T')[0] }));
                setShowCreateModal(true);
              }}
              onEventClick={(event) => {
                if (event.organizer_id === userId) {
                  openEditModal(event);
                } else {
                  if (isUserParticipating(event.id)) {
                    if (window.confirm(`Você está participando de "${event.title}". Deseja sair?`)) {
                      handleLeaveEvent(event);
                    }
                  } else {
                    if (window.confirm(`Deseja participar de "${event.title}"?`)) {
                      handleJoinEvent(event);
                    }
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
            {activeTab === "all" && (
              events.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500 text-lg">Nenhum evento encontrado.</p>
                  <Button variant="link" onClick={() => setShowCreateModal(true)} className="mt-2">
                    Crie o primeiro evento agora
                  </Button>
                </div>
              ) : (
                events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isOrganizer={event.organizer_id === userId}
                    isParticipating={isUserParticipating(event.id)}
                    isInvited={isUserInvited(event.id)}
                    onEdit={openEditModal}
                    onDelete={handleDeleteEvent}
                    onInvite={openInviteModal}
                    onViewParticipants={handleViewParticipants}
                    onJoin={handleJoinEvent}
                    onLeave={handleLeaveEvent}
                    onOpenChat={setSelectedEvent}
                  />
                ))
              )
            )}

            {activeTab === "my" && (
              myEvents.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500 text-lg">Você ainda não criou eventos.</p>
                  <Button variant="primary" onClick={() => setShowCreateModal(true)} className="mt-4">
                    Criar Evento
                  </Button>
                </div>
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
                    onOpenChat={setSelectedEvent}
                  />
                ))
              )
            )}

            {activeTab === "accepted" && (
              acceptedEvents.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500 text-lg">Nenhum evento confirmado na sua agenda.</p>
                </div>
              ) : (
                acceptedEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isOrganizer={event.organizer_id === userId}
                    isParticipating={true}
                    isInvited={true}
                    onEdit={openEditModal}
                    onDelete={handleDeleteEvent}
                    onInvite={openInviteModal}
                    onViewParticipants={handleViewParticipants}
                    onJoin={handleJoinEvent}
                    onLeave={handleLeaveEvent}
                    onOpenChat={setSelectedEvent}
                  />
                ))
              )
            )}

            {activeTab === "invites" && (
              (invites.length === 0 && notifications.length === 0) ? (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500 text-lg">Nenhuma notificação.</p>
                </div>
              ) : (
                <>
                  {notifications.map(notification => (
                    <NotificationCard
                      key={`notif-${notification.id}`}
                      notification={notification}
                      onDismiss={handleDismissNotification}
                    />
                  ))}
                  {invites.map(invite => (
                    <InviteCard
                      key={`invite-${invite.participation_id}`}
                      invite={invite}
                      onAccept={handleAcceptInvite}
                      onDecline={handleDeclineInvite}
                    />
                  ))}
                </>
              )
            )}
          </div>
        )
      }

      {/* Modals */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEventForm({ title: "", description: "", start_date: "", start_time: "", is_public: true });
          setSelectedUsers([]);
        }}
        title="Criar Novo Evento"
      >
        <form onSubmit={handleCreateEvent} className="space-y-6">
          <Input
            label="Título do Evento"
            value={eventForm.title}
            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
            required
            placeholder="Ex: Reunião de Planejamento"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
              placeholder="Detalhes do evento..."
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={eventForm.is_public}
                onChange={(e) => setEventForm({ ...eventForm, is_public: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <div className="ml-3">
                <span className="block text-sm font-medium text-gray-900">Evento Público</span>
                <span className="block text-xs text-gray-500">
                  {eventForm.is_public
                    ? "Visível para todos os usuários"
                    : "Apenas convidados podem ver"}
                </span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data e Hora</label>
            <Calendar
              selectedDate={eventForm.start_date}
              onDateSelect={(date) => setEventForm({ ...eventForm, start_date: date })}
              selectedTime={eventForm.start_time}
              onTimeChange={(time) => setEventForm({ ...eventForm, start_time: time })}
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-900">Convidar Pessoas</h3>
              {selectedUsers.length > 0 && (
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                  {selectedUsers.length} selecionados
                </span>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {users.map(user => (
                <label
                  key={user.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${selectedUsers.includes(user.id)
                    ? 'bg-primary-50 border border-primary-200'
                    : 'bg-white border border-gray-100 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserForCreation(user.id)}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <div className="ml-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">{user.email}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              className="flex-1"
            >
              {selectedUsers.length > 0 ? `Criar e Convidar (${selectedUsers.length})` : "Criar Evento"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Evento"
      >
        <form onSubmit={handleUpdateEvent} className="space-y-6">
          <Input
            label="Título"
            value={eventForm.title}
            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={eventForm.is_public}
                onChange={(e) => setEventForm({ ...eventForm, is_public: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-900">Evento Público</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data e Hora</label>
            <Calendar
              selectedDate={eventForm.start_date}
              onDateSelect={(date) => setEventForm({ ...eventForm, start_date: date })}
              selectedTime={eventForm.start_time}
              onTimeChange={(time) => setEventForm({ ...eventForm, start_time: time })}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowEditModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" isLoading={loading} className="flex-1">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Convidar Pessoas"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Convide usuários para: <span className="font-semibold text-gray-900">{selectedEvent?.title}</span>
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {users.map(user => {
              const isParticipant = participants.some(p => p.user_id === user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">{user.email}</span>
                  </div>

                  {isParticipant ? (
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                      Já convidado
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleInviteUser(user)}
                      className="text-primary-600 hover:bg-primary-50"
                    >
                      Convidar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showParticipantsModal}
        onClose={() => setShowParticipantsModal(false)}
        title="Participantes"
      >
        <div className="space-y-4">
          {participants.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum participante ainda.</p>
          ) : (
            <div className="space-y-2">
              {participants.map((p, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {p.user_email?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.user_email}</p>
                      <p className="text-xs text-gray-500">
                        Status: <span className={`font-medium ${p.status === 'accepted' ? 'text-green-600' :
                          p.status === 'declined' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                          {p.status === 'accepted' ? 'Confirmado' :
                            p.status === 'declined' ? 'Recusado' : 'Pendente'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Chat Widget */}
      <ChatWidget user={user} currentEventId={selectedEvent?.id} />
    </Layout >
  );
}
