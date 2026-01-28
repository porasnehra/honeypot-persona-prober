import { useRef, useEffect } from 'react';
import { useHoneypotChat } from '@/hooks/useHoneypotChat';
import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { IntelligencePanel } from '@/components/IntelligencePanel';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';

const Index = () => {
  const { messages, isLoading, intelligence, isAnalyzing, sendMessage, clearChat } = useHoneypotChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="scan-line absolute inset-0 h-[200%]" />
      </div>

      <Header onClear={clearChat} messageCount={messages.length} />

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-4 cyber-glow">
                    <MessageSquare className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Honeypot Active</h2>
                  <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
                    Send a message to interact with the AI honeypot agent. Try simulating
                    scam messages to see the detection and intelligence extraction in action.
                  </p>
                  <div className="mt-6 p-4 bg-card border border-border rounded-lg max-w-md">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Example scam messages to try:
                    </h3>
                    <ul className="text-xs text-muted-foreground space-y-1 text-left">
                      <li>• "Congratulations! You've won $1,000,000 in the lottery!"</li>
                      <li>• "Your account has been compromised. Send OTP immediately."</li>
                      <li>• "I'm a Nigerian prince and need your help..."</li>
                      <li>• "Urgent: Pay ₹5000 to UPI xyz@paytm to avoid account block"</li>
                    </ul>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <TypingIndicator />
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-card/50">
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              placeholder="Simulate a message (try scam patterns to test detection)..."
            />
          </div>
        </div>

        {/* Intelligence Panel */}
        <div className="w-96 shrink-0 hidden lg:block">
          <IntelligencePanel intelligence={intelligence} isAnalyzing={isAnalyzing} />
        </div>
      </div>
    </div>
  );
};

export default Index;
