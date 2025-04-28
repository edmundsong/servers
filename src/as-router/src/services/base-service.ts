import { AttestationService, QuoteVerificationResult, ServiceStatus, TeeSupport, TeeTechnology } from '../types.js';
import { ProviderUnavailableError, UnsupportedTeeError } from '../errors.js';

export abstract class BaseAttestationService implements AttestationService {
  protected name: string;
  protected supportedTypes: TeeTypes[];
  
  constructor(name: string, supportedTypes: TeeTypes[]) {
    this.name = name;
    this.supportedTypes = supportedTypes;
  }

  abstract verifyQuote(quote: string, nonce?: string, options?: Record<string, any>): Promise<QuoteVerificationResult>;
  
  async getStatus(): Promise<ServiceStatus> {
    try {
      const startTime = Date.now();
      // Make a basic health check call to the service
      await this.healthCheck();
      const endTime = Date.now();
      
      return {
        available: true,
        latency: endTime - startTime,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        available: false,
        message: error instanceof Error ? error.message : String(error),
        lastChecked: new Date().toISOString()
      };
    }
  }
  
  async getSupportedTee(): Promise<TeeSupport> {
    return {
    ] supportedTypes: this.supportedTypes,
    };
  }
  
  async isTeeSupported(tee: TeeType): Promise<boolean> {
    return this.supportedTypes.includes(tee);
  }
  
  protected abstract healthCheck(): Promise<void>;
}