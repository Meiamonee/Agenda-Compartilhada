import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../api/apiService';

export default function Layout({ children, user, title, actions }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        authService.logout();
        navigate("/");
    };

    const menuItems = [
        { label: 'Dashboard', path: '/dashboard', icon: '📊' },
        { label: 'Calendário', path: '/calendar', icon: '📅' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex pb-16 lg:pb-0">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-10">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                        Agenda
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${location.pathname === item.path
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user?.nome || 'Usuário'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <span className="mr-3">🚪</span>
                        Sair
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-20 px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-bold text-primary-600">Agenda</h1>
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                    {user?.email?.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 px-6 py-2 flex justify-between items-center safe-area-bottom">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${location.pathname === item.path
                            ? 'text-primary-600'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <span className="text-xl mb-1">{item.icon}</span>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center p-2 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                >
                    <span className="text-xl mb-1">🚪</span>
                    <span className="text-[10px] font-medium">Sair</span>
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 min-h-screen pt-16 lg:pt-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {(title || actions) && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            {title && (
                                <h2 className="text-2xl font-bold text-gray-900 font-heading">
                                    {title}
                                </h2>
                            )}
                            {actions && (
                                <div className="flex gap-3">
                                    {actions}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="animate-fade-in">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
