import { useState, useCallback, useRef } from 'react';
import { Message, IntelligenceReport, ConversationMessage, GuviFinalResult, ExtractedIntelligence } from '@/types/honeypot';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/honeypot-chat`;
const ANALYSIS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-intelligence`;
const SUBMIT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-final-result`;

export function useHoneypotChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [intelligence, setIntelligence] = useState<IntelligenceReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  // Convert internal messages to API conversation format
  const toConversationHistory = useCallback((msgs: Message[]): ConversationMessage[] => {
    return msgs.map(m => ({
      sender: m.role === 'user' ? 'scammer' : 'user',
      text: m.content,
      timestamp: m.timestamp.toISOString(),
    }));
  }, []);

  const analyzeConversation = useCallback(async (conversationHistory: ConversationMessage[]) => {
    if (conversationHistory.length < 2) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(ANALYSIS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          conversationHistory,
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

    try {
      // Build conversation history from existing messages
      const conversationHistory = toConversationHistory(messages);
      
      // Create API request in GUVI format
      const apiRequest = {
        sessionId: sessionIdRef.current,
        message: {
          sender: 'scammer' as const,
          text: content,
          timestamp: new Date().toISOString(),
        },
        conversationHistory,
        metadata: {
          channel: 'Web' as const,
          language: 'English',
          locale: 'IN',
        },
      };

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(apiRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.reply) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.reply,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Analyze after response complete
        const updatedHistory = [
          ...conversationHistory,
          { sender: 'scammer' as const, text: content, timestamp: new Date().toISOString() },
          { sender: 'user' as const, text: result.reply, timestamp: new Date().toISOString() },
        ];
        analyzeConversation(updatedHistory);
      } else {
        throw new Error(result.reply || 'Unknown error');
      }
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
  }, [messages, toConversationHistory, analyzeConversation]);

  const submitFinalResult = useCallback(async () => {
    if (!intelligence) return;
    
    setIsSubmitting(true);
    try {
      const payload: GuviFinalResult = {
        sessionId: sessionIdRef.current,
        scamDetected: intelligence.isScam,
        totalMessagesExchanged: messages.length,
        extractedIntelligence: intelligence.extractedData as ExtractedIntelligence,
        agentNotes: intelligence.summary || 'No additional notes',
      };

      const response = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('Final result submitted to GUVI:', result);
        return { success: true, message: 'Results submitted successfully!' };
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Submission failed' };
    } finally {
      setIsSubmitting(false);
    }
  }, [intelligence, messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setIntelligence(null);
    sessionIdRef.current = crypto.randomUUID(); // New session
  }, []);

  const getSessionId = useCallback(() => sessionIdRef.current, []);

  return {
    messages,
    isLoading,
    intelligence,
    isAnalyzing,
    isSubmitting,
    sendMessage,
    clearChat,
    submitFinalResult,
    getSessionId,
  };
}
