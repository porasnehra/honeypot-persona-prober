import { Message } from '@/types/honeypot';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isUser ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3',
          isUser
            ? 'bg-primary/10 border border-primary/20'
            : 'bg-card border border-border'
        )}
      >
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <span className="text-xs text-muted-foreground mt-2 block">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
