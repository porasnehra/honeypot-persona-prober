export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ExtractedData {
  bankAccounts: string[];
  upiIds: string[];
  phoneNumbers: string[];
  emails: string[];
  urls: string[];
  cryptoWallets: string[];
  names: string[];
  organizations: string[];
}

export interface IntelligenceReport {
  isScam: boolean;
  scamType: string | null;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  extractedData: ExtractedData;
  indicators: string[];
  summary: string;
}
