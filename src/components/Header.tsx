import { Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onClear: () => void;
  messageCount: number;
}

export function Header({ onClear, messageCount }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20 cyber-glow">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-primary">Honey</span>
            <span className="text-foreground">Pot</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Scam Detection & Intelligence Extraction
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          <span className="font-mono text-primary">{messageCount}</span> messages
        </div>
        
        {messageCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="gap-2 border-border hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
          >
            <RefreshCw className="h-4 w-4" />
            Clear Session
          </Button>
        )}
      </div>
    </header>
  );
}
