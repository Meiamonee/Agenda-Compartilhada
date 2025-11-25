import { useState } from "react";

export default function EventCard({ 
  event, 
  isOrganizer,
  isParticipating,
  isInvited = false,
  onEdit, 
  onDelete, 
  onInvite, 
  onViewParticipants,
  onJoin,
  onLeave
}) {
  const [showActions, setShowActions] = useState(false);
  
  // Garante que só é público se explicitamente true
  const isPublic = event.is_public === true;
  const canParticipate = isPublic || isInvited || isOrganizer;

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
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
        {isOrganizer && (
          <button 
            onClick={() => setShowActions(!showActions)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        )}
      </div>

      {event.description && (
        <p className="text-gray-600 mb-3">{event.description}</p>
      )}

      <div className="space-y-2 text-sm text-gray-700 mb-4">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span>Início: {formatDateTime(event.start_time)}</span>
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span>Fim: {formatDateTime(event.end_time)}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {isOrganizer && (
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
            Organizador
          </span>
        )}
        {isPublic ? (
          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
            Público
          </span>
        ) : (
          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-semibold">
            Privado
          </span>
        )}
      </div>

      {showActions && isOrganizer && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          <button
            onClick={() => onEdit(event)}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
          >
            Editar
          </button>
          <button
            onClick={() => onInvite(event)}
            className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
          >
            Convidar
          </button>
          <button
            onClick={() => onViewParticipants(event)}
            className="px-3 py-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm"
          >
            Participantes
          </button>
          <button
            onClick={() => onDelete(event)}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
          >
            Deletar
          </button>
        </div>
      )}
      
      {!isOrganizer && (
        <div className="mt-3 space-y-2">
          {isParticipating ? (
            <button
              onClick={() => onLeave(event)}
              className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-semibold"
            >
              Sair do Evento
            </button>
          ) : (
            <button
              onClick={() => onJoin(event)}
              disabled={!canParticipate}
              className={`w-full px-3 py-2 rounded-md text-sm font-semibold ${
                canParticipate
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!canParticipate ? 'Evento privado - Você precisa de um convite' : ''}
            >
              {canParticipate ? 'Participar do Evento' : 'Convite Necessário'}
            </button>
          )}
          <button
            onClick={() => onViewParticipants(event)}
            className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            Ver Participantes
          </button>
        </div>
      )}
    </div>
  );
}

