import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
        <Bot className="h-4 w-4" />
      </div>
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <div className="typing-indicator flex gap-1">
          <span className="w-2 h-2 bg-primary rounded-full"></span>
          <span className="w-2 h-2 bg-primary rounded-full"></span>
          <span className="w-2 h-2 bg-primary rounded-full"></span>
        </div>
      </div>
    </div>
  );
}
