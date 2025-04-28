// Type definitions for the attestation service

export type AttestationServiceProvider = 'google' | 'alibaba' | 'trustee';

export type TeeTechnology = 'tdx' | 'sgx' | 'sev' | 'cvm';

export interface QuoteVerificationResult {
  verified: boolean;
  tcbStatus?: 'up-to-date' | 'out-of-date' | 'revoked';
  timestamp: string;
  mrEnclave?: string;
  mrSigner?: string;
  productId?: string;
  svn?: string;
  additionalData?: Record<string, any>;
  rawResponse?: Record<string, any>;
}

export interface ServiceStatus {
  available: boolean;
  latency?: number;
  message?: string;
  lastChecked: string;
}

export interface TeeSupport {
    supportedTypes: TeeTypes[];

}

export interface AttestationService {
  verifyQuote(quote: string, nonce?: string, options?: Record<string, any>): Promise<QuoteVerificationResult>;
  getStatus(): Promise<ServiceStatus>;
  getSupportedTee(): Promise<TeeSupport>;
  isTeeSupported(tee: TeeType): Promise<boolean>;
}