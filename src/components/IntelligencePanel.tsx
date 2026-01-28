import { IntelligenceReport } from '@/types/honeypot';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Banknote,
  Phone,
  Mail,
  Link,
  Wallet,
  User,
  Building,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IntelligencePanelProps {
  intelligence: IntelligenceReport | null;
  isAnalyzing: boolean;
}

export function IntelligencePanel({ intelligence, isAnalyzing }: IntelligencePanelProps) {
  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'medium':
        return <Shield className="h-5 w-5 text-warning" />;
      default:
        return <ShieldCheck className="h-5 w-5 text-accent" />;
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-accent/20 text-accent border-accent/30';
    }
  };

  const dataItems = intelligence?.extractedData
    ? [
        { icon: Banknote, label: 'Bank Accounts', data: intelligence.extractedData.bankAccounts },
        { icon: Wallet, label: 'UPI IDs', data: intelligence.extractedData.upiIds },
        { icon: Phone, label: 'Phone Numbers', data: intelligence.extractedData.phoneNumbers },
        { icon: Mail, label: 'Emails', data: intelligence.extractedData.emails },
        { icon: Link, label: 'URLs', data: intelligence.extractedData.urls },
        { icon: Wallet, label: 'Crypto Wallets', data: intelligence.extractedData.cryptoWallets },
        { icon: User, label: 'Names', data: intelligence.extractedData.names },
        { icon: Building, label: 'Organizations', data: intelligence.extractedData.organizations },
      ]
    : [];

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Intelligence Report
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Analyzing conversation...</span>
            </div>
          )}

          {!intelligence && !isAnalyzing && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Start a conversation to begin analysis</p>
            </div>
          )}

          {intelligence && (
            <>
              {/* Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Detection Status
                </h3>
                <div className="flex items-center gap-3">
                  {intelligence.isScam ? (
                    <Badge className={cn('gap-1', getThreatColor(intelligence.threatLevel))}>
                      {getThreatIcon(intelligence.threatLevel)}
                      SCAM DETECTED
                    </Badge>
                  ) : (
                    <Badge className="gap-1 bg-accent/20 text-accent border-accent/30">
                      <CheckCircle2 className="h-4 w-4" />
                      CLEAN
                    </Badge>
                  )}
                </div>

                {intelligence.scamType && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline" className="capitalize">
                      {intelligence.scamType.replace('_', ' ')}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Confidence:</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        intelligence.confidence > 70
                          ? 'bg-destructive'
                          : intelligence.confidence > 40
                          ? 'bg-warning'
                          : 'bg-accent'
                      )}
                      style={{ width: `${intelligence.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono">{intelligence.confidence}%</span>
                </div>
              </div>

              {/* Summary */}
              {intelligence.summary && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Summary
                  </h3>
                  <p className="text-sm leading-relaxed">{intelligence.summary}</p>
                </div>
              )}

              {/* Indicators */}
              {intelligence.indicators.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Indicators
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {intelligence.indicators.map((indicator, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs bg-destructive/10 text-destructive border-destructive/30"
                      >
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Data */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Extracted Intelligence
                </h3>
                {dataItems.map(({ icon: Icon, label, data }) =>
                  data && data.length > 0 ? (
                    <div key={label} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                      <div className="pl-6 space-y-1">
                        {data.map((item, i) => (
                          <code
                            key={i}
                            className="block text-xs font-mono bg-muted px-2 py-1 rounded text-primary"
                          >
                            {item}
                          </code>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}

                {dataItems.every(({ data }) => !data || data.length === 0) && (
                  <p className="text-sm text-muted-foreground italic">
                    No intelligence extracted yet
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
