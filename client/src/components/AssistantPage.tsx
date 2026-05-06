import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { type: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/assistant', { command: userMsg });
      const reply = res.data.reply || 'Something went wrong.';
      setMessages((prev) => [...prev, { type: 'assistant', content: reply }]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to process command.';
      setMessages((prev) => [...prev, { type: 'assistant', content: `❌ ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <h1 className="text-3xl font-bold mb-4">Task Assistant</h1>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Try commands like: <br />
              <code>create task "Design" in project "Website"</code><br />
              <code>assign "Design" to "John"</code><br />
              <code>move "Design" to in-progress</code><br />
              <code>list tasks in project "Website"</code>
            </p>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                <pre className="text-sm whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
            </div>
          ))}
          {loading && <p className="text-sm text-muted-foreground">Thinking...</p>}
          <div ref={endRef} />
        </CardContent>
        <form onSubmit={sendCommand} className="border-t p-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., create task '...' in project '...'"
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}