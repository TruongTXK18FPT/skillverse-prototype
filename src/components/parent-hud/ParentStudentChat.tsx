import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Send, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../services/axiosInstance';
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

        // Connect WebSocket
        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
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
        <div className="ps-chat-container">
            <div className="ps-chat-header">
                <div className="ps-chat-user-info">
                    <img 
                        src={studentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentName}`} 
                        alt={studentName} 
                        className="ps-chat-avatar" 
                    />
                    <div>
                        <h3>{studentName}</h3>
                        <span className={`ps-status ${connected ? 'online' : 'offline'}`}>
                            {connected ? 'Online' : 'Connecting...'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="ps-chat-messages">
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                        <div key={index} className={`ps-message-wrapper ${isMe ? 'me' : 'other'}`}>
                            {!isMe && (
                                <img 
                                    src={studentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentName}`} 
                                    className="ps-message-avatar" 
                                    alt="avatar" 
                                />
                            )}
                            <div className={`ps-message-bubble ${isMe ? 'me' : 'other'}`}>
                                <p>{msg.content}</p>
                                <span className="ps-message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="ps-chat-input-area">
                <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="ps-chat-input"
                />
                <button onClick={handleSendMessage} className="ps-chat-send-btn" disabled={!connected}>
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default ParentStudentChat;
