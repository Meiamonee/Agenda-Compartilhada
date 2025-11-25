import { useState } from "react";

export default function Calendar({ selectedDate, onDateSelect, selectedTime, onTimeChange }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Dias do mês anterior (vazios)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      onDateSelect(formattedDate);
    }
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === selectedDate;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="p-2 hover:bg-gray-700 rounded-md transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <div className="text-lg font-semibold">
            {months[currentMonth.getMonth()]} de {currentMonth.getFullYear()}
          </div>
        </div>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="p-2 hover:bg-gray-700 rounded-md transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-2 ${
              index === 0 || index === 6 ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Dias do Mês */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleDateClick(date)}
            disabled={!date}
            className={`
              aspect-square flex items-center justify-center rounded-md text-sm font-medium transition
              ${!date ? 'invisible' : ''}
              ${isSelected(date) 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : isToday(date)
                ? 'bg-gray-700 text-white hover:bg-gray-600 ring-2 ring-blue-400'
                : 'hover:bg-gray-700 text-gray-300'
              }
              ${(index % 7 === 0 || index % 7 === 6) && !isSelected(date) && !isToday(date) ? 'text-red-400' : ''}
            `}
          >
            {date ? date.getDate() : ''}
          </button>
        ))}
      </div>

      {/* Seletor de Hora */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Horário
        </label>
        <input
          type="time"
          value={selectedTime}
          onChange={(e) => onTimeChange(e.target.value)}
          required
          className="w-full px-4 py-3 text-lg bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Botão Limpar */}
      <button
        type="button"
        onClick={() => {
          onDateSelect("");
          onTimeChange("");
        }}
        className="mt-3 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md text-sm transition"
      >
        Limpar
      </button>
    </div>
  );
}

