import { useState, useEffect } from "react";
// IMPORTANTE: Importamos a instância correta para eventos
import { eventsApi } from "../api/api"; 

export default function Dashboard() {
  // 1. Recuperação dos dados do usuário logado
  const userString = localStorage.getItem("user");
  let user = {};

  try {
    user = userString ? JSON.parse(userString) : {};
  } catch (error) {
    console.error("Erro ao analisar dados do usuário no localStorage:", error);
  }

  // Pegamos o ID do usuário para vincular ao evento
  const userId = user.id; 

  // 2. Variáveis de Estado para Eventos e Feedback
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [descricao, setDescricao] = useState("");
  const [eventos, setEventos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // 3. Lógica para Buscar Eventos (GET /eventos)
  const fetchEvents = async () => {
    try {
      // USANDO eventsApi: Chama a rota GET /eventos do seu Serviço de Eventos
      const res = await eventsApi.get("/eventos"); 
      setEventos(res.data);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      setErro("Não foi possível carregar os eventos.");
    }
  };

  // Carrega a lista de eventos assim que o componente é montado
  useEffect(() => {
    fetchEvents();
  }, []);

  // 4. Lógica para Criar Evento (POST /eventos)
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setIsLoading(true);

    if (!userId) {
        setErro("ID do usuário não encontrado. Faça login novamente.");
        setIsLoading(false);
        return;
    }

    try {
      const newEvent = {
        titulo,
        descricao,
        data,
        hora,
        usuario_id: userId, // ESSENCIAL: Vincula o evento ao usuário logado
      };

      // USANDO eventsApi: Chama a rota POST /eventos do seu Serviço de Eventos
      await eventsApi.post("/eventos", newEvent);

      setSucesso("Evento criado com sucesso!");
      // Limpa e atualiza
      setTitulo(""); setDescricao(""); setData(""); setHora("");
      await fetchEvents();

    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao criar evento. Verifique se os backends estão online.";
      setErro(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Renderização (HTML/JSX) - MANTÉM A ESTRUTURA ANTERIOR

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <div className="w-full max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">
            Bem-vindo, {user.nome || user.email || "Usuário"}!
          </h1>
          <p className="text-gray-400">Gerencie sua agenda compartilhada.</p>
        </div>
        
        {/* Mensagens de feedback */}
        {erro && (
            <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg mb-4">{erro}</div>
        )}
        {sucesso && (
            <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg mb-4">{sucesso}</div>
        )}

        {/* --- Formulário de Criação de Evento --- */}
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl mb-10">
            <h2 className="text-2xl font-semibold mb-6">Criar Novo Evento</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
                <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Nome do Evento (Título)"
                    required
                    className="w-full h-10 px-3 border rounded-md text-gray-900 bg-gray-200"
                />
                <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descrição do Evento"
                    className="w-full h-10 px-3 border rounded-md text-gray-900 bg-gray-200"
                />
                <div className="flex space-x-4">
                    <input
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        required
                        className="w-1/2 h-10 px-3 border rounded-md text-gray-900 bg-gray-200"
                    />
                    <input
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        required
                        className="w-1/2 h-10 px-3 border rounded-md text-gray-900 bg-gray-200"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold disabled:opacity-50 transition duration-150"
                >
                    {isLoading ? "Criando..." : "Criar Evento"}
                </button>
            </form>
        </div>

        {/* --- Listagem de Eventos --- */}
        <div className="p-8 bg-gray-800 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-6 border-b border-gray-700 pb-3">Seus Eventos Registrados ({eventos.length})</h2>
            
            {eventos.length === 0 ? (
                <p className="text-gray-400">Nenhum evento registrado. Crie um novo acima!</p>
            ) : (
                <div className="space-y-4">
                    {eventos.map((evento) => (
                        <div key={evento.id} className="bg-gray-700 p-4 rounded-md border border-gray-600">
                            <h3 className="text-xl font-bold text-blue-400">{evento.titulo}</h3>
                            <p className="text-sm text-gray-300">
                                Data: <span className="font-semibold">{evento.data}</span> às <span className="font-semibold">{evento.hora}</span>
                            </p>
                            <p className="text-sm text-gray-400 mt-2">{evento.descricao}</p>
                            {/* Criado por: {evento.usuario_id} - Você pode buscar o nome do criador no futuro! */}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}