import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { auth } from '../config/firebase';
import api from '../services/api';
import useCurrentUser from '../hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface Message {
  _id: string;
  content: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
  };
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const { user } = useCurrentUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const messageIds = useRef(new Set<string>()); // to prevent duplicates

  // Fetch message history
  useEffect(() => {
    api.get('/messages')
      .then(res => {
        const msgs: Message[] = res.data.messages.reverse();
        setMessages(msgs);
        // populate the set with existing ids
        msgs.forEach(m => messageIds.current.add(m._id));
      })
      .catch(() => {});
  }, []);

  // Socket connection with strict cleanup
  useEffect(() => {
    const token = auth.currentUser?.getIdToken;
    if (!token) return;

    const connectSocket = async () => {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      // only create one socket
      if (socketRef.current?.connected) return;

      const socket = io('https://team-collab-api.onrender.com', { auth: { token: idToken } }); 
      socketRef.current = socket;

      socket.on('connect', () => {
        api.get('/auth/me').then(res => {
          const teamId = res.data.teamId;
          if (teamId) socket.emit('join-team', teamId);
        }).catch(() => {});
      });

      const handleNewMessage = (msg: Message) => {
        // prevent exact duplicate (by _id)
        if (!messageIds.current.has(msg._id)) {
          messageIds.current.add(msg._id);
          setMessages(prev => [...prev, msg]);
        }
      };

      socket.on('new-message', handleNewMessage);

      // Cleanup listener when component unmounts or effect re-runs
      return () => {
        socket.off('new-message', handleNewMessage);
        socket.disconnect();
        socketRef.current = null;
      };
    };

    let cleanup: (() => void) | undefined;
    connectSocket().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
    };
  }, []); // empty – runs once in production, twice in StrictMode (handled by cleanup)

  // Auto‑scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await api.post('/messages', { content });
      setContent('');
      // Message will appear via socket – NO manual insertion
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <h1 className="text-3xl font-bold mb-4">Team Chat</h1>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${user && msg.senderId._id === user._id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  user && msg.senderId._id === user._id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold">{msg.senderId.name}</span>
                  <span className="text-xs opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>

        <form onSubmit={sendMessage} className="border-t p-4 flex gap-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}