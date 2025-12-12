import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Button from './Button';

const EVENTS_API_URL = import.meta.env.VITE_EVENTS_API_URL || 'http://localhost:3002';

export default function ChatWidget({ user, currentEventId = null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem("token");
        if (!token) {
            console.error("❌ Token não encontrado no localStorage");
            return;
        }

        const newSocket = io(EVENTS_API_URL, {
            auth: {
                token: token
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        newSocket.on('connect', () => {
            console.log('✅ Conectado ao chat via Socket.io');
            setConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Desconectado do chat. Motivo:', reason);
            setConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Reconectado ao chat após', attemptNumber, 'tentativa(s)');
            setConnected(true);
            if (currentEventId) {
                newSocket.emit('join_event_chat', currentEventId);
            }
        });

        newSocket.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔄 Tentando reconectar... Tentativa', attemptNumber);
        });

        newSocket.on('reconnect_error', (error) => {
            console.error('❌ Erro ao tentar reconectar:', error.message);
        });

        newSocket.on('reconnect_failed', () => {
            console.error('❌ Falha ao reconectar após todas as tentativas');
            setConnected(false);
        });

        newSocket.on('chat_error', (error) => {
            console.error('❌ Erro no chat:', error);
            alert(error);
        });

        newSocket.on('joined', (message) => {
            console.log(message);
        });

        newSocket.on('receive_message', (message) => {
            setMessages(prev => [...prev, message]);
            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
            }
        });

        newSocket.on('new_notification', (message) => {
            console.log('Nova notificação:', message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [user]);

    useEffect(() => {
        if (socket && connected && currentEventId) {
            socket.emit('join_event_chat', currentEventId);
            setMessages([]);
            loadChatHistory(currentEventId);
        }
    }, [socket, connected, currentEventId]);

    const loadChatHistory = async (eventId) => {
        try {
            const response = await fetch(`${EVENTS_API_URL}/eventos/${eventId}/chat/messages`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (response.ok) {
                const history = await response.json();
                setMessages(history.map(msg => ({
                    text: msg.message,
                    senderId: msg.sender_id,
                    senderEmail: msg.sender_email,
                    timestamp: msg.created_at
                })));
            }
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !currentEventId) return;

        socket.emit('send_message', { text: newMessage });
        setNewMessage('');
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    if (!currentEventId) {
        return null;
    }

    return (
        <>
            <button
                onClick={toggleChat}
                className="fixed bottom-6 right-6 w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
                aria-label="Abrir chat"
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </>
                )}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 animate-fade-in border border-gray-200">
                    <div className="bg-primary-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
                            <h3 className="font-semibold">Chat do Evento</h3>
                        </div>
                        <button
                            onClick={toggleChat}
                            className="hover:bg-primary-700 p-1 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-sm">Nenhuma mensagem ainda</p>
                                <p className="text-xs">Seja o primeiro a enviar uma mensagem!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isOwnMessage = msg.senderId === user.id;
                                return (
                                    <div
                                        key={index}
                                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                            {!isOwnMessage && (
                                                <p className="text-xs text-gray-500 mb-1 px-2">{msg.senderEmail}</p>
                                            )}
                                            <div
                                                className={`rounded-2xl px-4 py-2 ${isOwnMessage
                                                    ? 'bg-primary-600 text-white rounded-br-none'
                                                    : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                                                    }`}
                                            >
                                                <p className="text-sm break-words">{msg.text}</p>
                                                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-100' : 'text-gray-400'}`}>
                                                    {formatTime(msg.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Digite sua mensagem..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                disabled={!connected}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || !connected}
                                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                        {!connected && (
                            <p className="text-xs text-red-500 mt-2">Desconectado do servidor</p>
                        )}
                    </form>
                </div>
            )}
        </>
    );
}
