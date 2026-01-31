// API Input/Output Types (matching GUVI Hackathon spec)

export interface ConversationMessage {
  sender: 'scammer' | 'user';
  text: string;
  timestamp: string;
}

export interface MessageMetadata {
  channel: 'SMS' | 'WhatsApp' | 'Email' | 'Web';
  language: string;
  locale: string;
}

export interface HoneypotRequest {
  sessionId: string;
  message: {
    sender: 'scammer';
    text: string;
    timestamp: string;
  };
  conversationHistory: ConversationMessage[];
  metadata: MessageMetadata;
}

export interface HoneypotResponse {
  status: 'success' | 'error';
  reply: string;
}

// Internal UI types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ExtractedIntelligence {
  bankAccounts: string[];
  upiIds: string[];
  phishingLinks: string[];
  phoneNumbers: string[];
  suspiciousKeywords: string[];
}

export interface IntelligenceReport {
  isScam: boolean;
  scamType: string | null;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  extractedData: ExtractedIntelligence;
  indicators: string[];
  summary: string;
}

// GUVI Final Callback Payload
export interface GuviFinalResult {
  sessionId: string;
  scamDetected: boolean;
  totalMessagesExchanged: number;
  extractedIntelligence: ExtractedIntelligence;
  agentNotes: string;
}
