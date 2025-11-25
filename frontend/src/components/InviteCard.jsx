export default function InviteCard({ invite, onAccept, onDecline }) {
  const formatDateTime = (dateTime) => {
    if (!dateTime) return "Data não definida";
    const date = new Date(dateTime);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900">{invite.title}</h3>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-semibold">
          Pendente
        </span>
      </div>

      {invite.description && (
        <p className="text-gray-600 text-sm mb-3">{invite.description}</p>
      )}

      <div className="space-y-1 text-sm text-gray-700 mb-4">
        <p><strong>Início:</strong> {formatDateTime(invite.start_time)}</p>
        <p><strong>Fim:</strong> {formatDateTime(invite.end_time)}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAccept(invite)}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold transition"
        >
          Aceitar
        </button>
        <button
          onClick={() => onDecline(invite)}
          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold transition"
        >
          Recusar
        </button>
      </div>
    </div>
  );
}

