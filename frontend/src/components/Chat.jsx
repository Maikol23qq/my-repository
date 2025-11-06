import { useState, useEffect, useRef } from "react";
import { API_CHAT_URL } from "../config/api.js";

export default function Chat({ tripId, otherUserName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    loadMessages();
    // Polling cada 3 segundos para nuevos mensajes
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [tripId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function loadMessages() {
    if (!token || !tripId) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_CHAT_URL}/trips/${tripId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessages(data.messages || []);
        // Marcar mensajes como leídos
        if (data.messages && data.messages.length > 0) {
          markAsRead();
        }
      } else {
        console.error("Error al cargar mensajes:", data.error);
      }
    } catch (e) {
      console.error("Error al cargar mensajes:", e);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead() {
    if (!token || !tripId) return;
    
    try {
      await fetch(`${API_CHAT_URL}/trips/${tripId}/messages/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.error("Error al marcar como leído:", e);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !token || !tripId) return;
    
    try {
      setSending(true);
      const res = await fetch(`${API_CHAT_URL}/trips/${tripId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage.trim() })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar mensaje');
      }
      
      setNewMessage("");
      await loadMessages();
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">Chat con {otherUserName}</h3>
            <p className="text-sm text-gray-500">Viaje #{tripId.slice(-6)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No hay mensajes aún. ¡Envía el primero!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId._id?.toString() === userId || msg.senderId.toString() === userId;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isMe
                        ? 'bg-[#2A609E] text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">
                      {isMe ? 'Tú' : msg.senderId.nombre}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                    <div className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2A609E] outline-none resize-none"
              rows="2"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-[#2A609E] text-white px-6 py-2 rounded-lg hover:bg-[#224f84] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

