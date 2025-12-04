import React from 'react';
import Button from './Button';

export default function NotificationCard({ notification, onDismiss }) {
    const isUpdate = notification.type === 'update';
    const isCancel = notification.type === 'cancel';

    return (
        <div className={`
      relative p-5 rounded-xl border transition-all duration-200 hover:shadow-md
      ${isUpdate ? 'bg-blue-50 border-blue-100' : ''}
      ${isCancel ? 'bg-red-50 border-red-100' : ''}
    `}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`
              px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wider
              ${isUpdate ? 'bg-blue-100 text-blue-700' : ''}
              ${isCancel ? 'bg-red-100 text-red-700' : ''}
            `}>
                            {isUpdate ? 'Atualização' : 'Cancelamento'}
                        </span>
                        <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    <p className={`text-sm ${isUpdate ? 'text-blue-900' : 'text-red-900'}`}>
                        {notification.message}
                    </p>
                </div>

                <button
                    onClick={() => onDismiss(notification)}
                    className={`
            p-1 rounded-full transition-colors
            ${isUpdate ? 'text-blue-400 hover:bg-blue-100 hover:text-blue-600' : ''}
            ${isCancel ? 'text-red-400 hover:bg-red-100 hover:text-red-600' : ''}
          `}
                    title="Marcar como lida"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
