import React, { useState } from 'react';

// Paleta de 5 cores para eventos
const EVENT_COLORS = [
    { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', border: 'border-blue-100', text: 'text-blue-700', badge: 'bg-blue-200 text-blue-800' },
    { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', border: 'border-purple-100', text: 'text-purple-700', badge: 'bg-purple-200 text-purple-800' },
    { bg: 'bg-green-50', hover: 'hover:bg-green-100', border: 'border-green-100', text: 'text-green-700', badge: 'bg-green-200 text-green-800' },
    { bg: 'bg-orange-50', hover: 'hover:bg-orange-100', border: 'border-orange-100', text: 'text-orange-700', badge: 'bg-orange-200 text-orange-800' },
    { bg: 'bg-pink-50', hover: 'hover:bg-pink-100', border: 'border-pink-100', text: 'text-pink-700', badge: 'bg-pink-200 text-pink-800' }
];

// Função para obter cor baseada no ID do evento
const getEventColor = (eventId) => {
    return EVENT_COLORS[eventId % EVENT_COLORS.length];
};

export default function CalendarView({ events, onDateClick, onEventClick }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [hoveredDay, setHoveredDay] = useState(null);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return days;
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const days = [];
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100"></div>);
    }

    // Cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateString = date.toISOString().split('T')[0];

        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.start_time).toISOString().split('T')[0];
            return eventDate === dateString;
        });

        const hasEvents = dayEvents.length > 0;
        const isToday = new Date().toDateString() === date.toDateString();

        // Pega a cor do primeiro evento do dia para colorir o quadrado
        const dayColor = hasEvents ? getEventColor(dayEvents[0].id) : null;

        days.push(
            <div
                key={day}
                className={`h-24 border border-gray-100 p-2 relative transition-all cursor-pointer ${hasEvents
                        ? `${dayColor.bg} ${dayColor.hover}`
                        : 'hover:bg-gray-50'
                    }`}
                onClick={() => onDateClick(date)}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
            >
                <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isToday
                            ? 'bg-white text-gray-900 w-6 h-6 rounded-full flex items-center justify-center shadow-sm'
                            : hasEvents
                                ? `${dayColor.text} font-bold`
                                : 'text-gray-700'
                        }`}>
                        {day}
                    </span>
                    {hasEvents && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${dayColor.badge} font-semibold`}>
                            {dayEvents.length}
                        </span>
                    )}
                </div>

                {/* Tooltip com lista de eventos */}
                {hoveredDay === day && hasEvents && (
                    <div className="absolute z-50 left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 animate-fade-in">
                        <div className="text-xs font-semibold text-gray-500 mb-2">
                            {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {dayEvents.map(event => {
                                const eventTime = new Date(event.start_time);
                                return (
                                    <div
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                        className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                                    >
                                        <div className="font-medium text-sm text-gray-900 truncate" title={event.title}>
                                            {event.title}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {eventTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 capitalize">
                    {monthName}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 bg-white">
                {days}
            </div>
        </div>
    );
}
