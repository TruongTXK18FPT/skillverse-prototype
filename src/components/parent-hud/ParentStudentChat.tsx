import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Send, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance, { API_BASE_URL } from '../../services/axiosInstance';
import { getAccessToken } from '../../utils/authStorage';
import '../../styles/ParentStudentChat.css';

interface ChatMessage {
    id?: number;
    senderId: number;
    recipientId: number;
    senderName: string;
    recipientName: string;
    content: string;
    timestamp: string;
}

interface ParentStudentChatProps {
    studentId: number;
    studentName: string;
    studentAvatar?: string;
}

const ParentStudentChat: React.FC<ParentStudentChatProps> = ({ studentId, studentName, studentAvatar }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [connected, setConnected] = useState(false);
    const stompClientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;

        // Fetch history
        fetchChatHistory();

        // Connect WebSocket using shared axios base and token
        const socketUrl = (axiosInstance.defaults.baseURL || API_BASE_URL).replace(/\/api\/?$/, '/ws');
        const bearerHeader = (axiosInstance.defaults.headers?.Authorization as string) || '';
        const token = bearerHeader.replace(/^Bearer\s+/i, '') || getAccessToken() || '';
        const socket = new SockJS(`${socketUrl}?token=${token}`);
        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
            onConnect: () => {
                setConnected(true);
                client.subscribe(`/user/${user.id}/queue/messages`, (message) => {
                    const receivedMsg: ChatMessage = JSON.parse(message.body);
                    if (receivedMsg.senderId === studentId || receivedMsg.recipientId === studentId) {
                        setMessages(prev => [...prev, receivedMsg]);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            }
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (client.active) {
                client.deactivate();
            }
        };
    }, [user, studentId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchChatHistory = async () => {
        if (!user) return;
        try {
            const response = await axiosInstance.get<ChatMessage[]>(`/api/messages/${user.id}/${studentId}`);
            setMessages(response.data);
        } catch (error) {
            console.error("Failed to fetch chat history", error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !stompClientRef.current || !connected || !user) return;

        const chatMessage = {
            senderId: user.id,
            recipientId: studentId,
            senderName: user.fullName || user.email,
            recipientName: studentName,
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        stompClientRef.current.publish({
            destination: "/app/chat",
            body: JSON.stringify(chatMessage)
        });

        setMessages(prev => [...prev, chatMessage]);
        setNewMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="parent-v2-card" style={{ height: '500px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: 'var(--p-card-bg)', border: '1px solid var(--p-card-border)' }}>
            <div style={{ 
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid var(--p-card-border)', 
                background: 'var(--p-card-bg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                        <img 
                            src={studentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentName}`} 
                            alt={studentName} 
                            style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--p-accent-gold)' }} 
                        />
                        <div style={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            right: 0, 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            background: connected ? 'var(--p-accent-green)' : 'var(--p-text-muted)',
                            border: '2px solid var(--p-bg)'
                        }} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--p-text)', fontSize: '1rem', fontWeight: 700 }}>{studentName}</h3>
                        <span style={{ 
                            fontSize: '0.75rem', 
                            color: connected ? 'var(--p-accent-green)' : 'var(--p-text-muted)',
                            fontWeight: 600
                        }}>
                            {connected ? 'ĐÃ KẾT NỐI' : 'ĐANG KẾT NỐI...'}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '1.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                background: 'var(--p-bg)'
            }}>
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                        <div key={index} style={{ 
                            display: 'flex', 
                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                            width: '100%'
                        }}>
                            <div style={{ 
                                maxWidth: '80%',
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                background: isMe ? 'rgba(245, 158, 11, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                                border: isMe ? '1px solid var(--p-accent-gold)' : '1px solid var(--p-accent-cyan)',
                                position: 'relative'
                            }}>
                                <p style={{ margin: 0, color: 'var(--p-text)', fontSize: '0.95rem' }}>{msg.content}</p>
                                <span style={{ 
                                    display: 'block', 
                                    textAlign: 'right', 
                                    fontSize: '0.7rem', 
                                    color: 'var(--p-text-muted)', 
                                    marginTop: '0.25rem',
                                    fontWeight: 600
                                }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ 
                padding: '1rem', 
                borderTop: '1px solid var(--p-card-border)',
                background: 'var(--p-card-bg)',
                display: 'flex',
                gap: '0.75rem'
            }}>
                <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="parent-v2-input-glow"
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        fontSize: '0.95rem',
                        outline: 'none'
                    }}
                />
                <button 
                    onClick={handleSendMessage} 
                    disabled={!connected}
                    className="parent-v2-btn-gold"
                    style={{ padding: '0.75rem' }}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default ParentStudentChat;
