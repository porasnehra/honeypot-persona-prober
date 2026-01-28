import { useState, useCallback } from 'react';
import { Message, IntelligenceReport } from '@/types/honeypot';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/honeypot-chat`;
const ANALYSIS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-intelligence`;

export function useHoneypotChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [intelligence, setIntelligence] = useState<IntelligenceReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeConversation = useCallback(async (conversation: Message[]) => {
    if (conversation.length < 2) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(ANALYSIS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          conversation: conversation.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIntelligence(data);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = '';
    
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: assistantContent,
          timestamp: new Date(),
        }];
      });
    };

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Analyze after response complete
      setMessages(current => {
        analyzeConversation(current);
        return current;
      });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, analyzeConversation]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setIntelligence(null);
  }, []);

  return {
    messages,
    isLoading,
    intelligence,
    isAnalyzing,
    sendMessage,
    clearChat,
  };
}
