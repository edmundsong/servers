import { BaseAttestationService } from './base-service.js';
import { QuoteVerificationResult } from '../types.js';
import { MalformedQuoteError, ProviderUnavailableError, QuoteValidationError } from '../errors.js';
import fetch from 'node-fetch';

export class AlibabaASWrapper extends BaseAttestationService {
  private apiEndpoint: string;
  private apiKey?: string;
  
  constructor() {
    super('Alibaba', ['tdx']);
    const { endpoint, apiKey } = CONFIG.providers.alibaba;
    this.apiEndpoint = endpoint;
    this.apiKey = apiKey;
  }
  
  async verifyQuote(quote: string, nonce?: string, options?: Record<string, any>): Promise<QuoteVerificationResult> {
    if (!this.apiKey) {
      throw new ProviderUnavailableError('Alibaba', 'API key not configured');
    }
    
    try {
      // Decode and validate the quote format
      this.validateQuoteFormat(quote);
      // Prepare the evidence object
      const evidence = {
        quote: quoteBase64,
        aa_eventlog: null,
        cc_eventlog: null,
      };
      // Base64 encode the evidence with URL-safe characters and without padding
      const evidenceBase64 = Buffer.from(JSON.stringify(evidence))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      const requestPayload = {
        policy_ids: [], // Empty policy_ids means only check the cryptographic integrity of the evidence
        tee: 'tdx',
        evidence: evidenceBase64,
      };
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new QuoteValidationError(`Alibaba attestation failed: ${response.statusText}`, { 
          status: response.status, 
          response: errorText 
        });
      }
      
      const result = await response.json() as any;
      
      return {
        verified: result.verified === true,
        tcbStatus: result.tcbStatus?.toLowerCase() || 'unknown',
        timestamp: new Date().toISOString(),
        mrEnclave: result.mrEnclave,
        mrSigner: result.mrSigner,
        productId: result.productId,
        svn: result.svn,
        additionalData: result.additionalData,
        rawResponse: result
      };
      
    } catch (error) {
      if (error instanceof QuoteValidationError || error instanceof MalformedQuoteError) {
        throw error;
      }
      throw new QuoteValidationError(`Error verifying quote with Google: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  protected async healthCheck(): Promise<void> {
    if (!this.apiKey) {
      throw new ProviderUnavailableError('Alibaba', 'API key not configured');
    }
    
    const response = await fetch(`${this.apiEndpoint}/status?key=${this.apiKey}`);
    if (!response.ok) {
      throw new ProviderUnavailableError('Alibaba', `API returned status ${response.status}: ${response.statusText}`);
    }
  }
  
  private validateQuoteFormat(quote: string): void {
    try {
      // Basic validation to ensure it looks like a base64 encoded string
      if (!/^[A-Za-z0-9+/=]+$/.test(quote)) {
        throw new MalformedQuoteError('Invalid base64 characters');
      }
      
      // Additional validation could be added here
      
    } catch (error) {
      throw new MalformedQuoteError(error instanceof Error ? error.message : String(error));
    }
  }
}