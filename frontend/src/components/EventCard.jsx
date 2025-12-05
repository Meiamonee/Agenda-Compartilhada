import { useState, useRef, useEffect } from "react";
import React from "react";
import Button from "./Button";

export default function EventCard({
  event,
  isOrganizer,
  isParticipating,
  isInvited,
  onEdit,
  onDelete,
  onInvite,
  onViewParticipants,
  onJoin,
  onLeave
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    if (isOrganizer) {
      return <span className="px-2 py-1 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">Organizador</span>;
    }
    if (isParticipating) {
      return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Participando</span>;
    }
    if (isInvited) {
      return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">Convidado</span>;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full relative">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-primary-50 rounded-lg p-2 text-center min-w-[60px]">
            <span className="block text-xs font-bold text-primary-600 uppercase">
              {startDate.toLocaleDateString("pt-BR", { month: 'short' })}
            </span>
            <span className="block text-xl font-bold text-gray-900">
              {startDate.getDate()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {!event.is_public && (
              <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">Privado</span>
            )}

            {isOrganizer && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 animate-fade-in">
                    <button
                      onClick={() => { setShowMenu(false); onEdit(event); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Editar
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onInvite(event); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Convidar
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onViewParticipants(event); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      Participantes
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => { setShowMenu(false); onDelete(event); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 font-heading">
          {event.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {event.description || "Sem descrição"}
        </p>

        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>
              {formatTime(startDate)} - {formatTime(endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="truncate">Org: {event.organizer_email}</span>
          </div>
        </div>
      </div>

      {!isOrganizer && (
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onViewParticipants(event)}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Participantes
          </Button>
          <div className="flex gap-2">
            {isParticipating ? (
              <Button variant="danger" size="sm" onClick={() => onLeave(event)}>
                Sair do Evento
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => onJoin(event)}>
                Participar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
