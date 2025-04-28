// Custom error types for attestation services

export class AttestationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttestationError';
  }
}

export class QuoteValidationError extends AttestationError {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'QuoteValidationError';
  }
}

export class ProviderUnavailableError extends AttestationError {
  constructor(provider: string, public reason?: string) {
    super(`Attestation provider ${provider} is unavailable${reason ? `: ${reason}` : ''}`);
    this.name = 'ProviderUnavailableError';
  }
}

export class UnsupportedTeeError extends AttestationError {
  constructor(technology: string, provider: string) {
    super(`TEE technology ${technology} is not supported by provider ${provider}`);
    this.name = 'UnsupportedTeeError';
  }
}

export class MalformedQuoteError extends AttestationError {
  constructor(message: string) {
    super(`Malformed quote: ${message}`);
    this.name = 'MalformedQuoteError';
  }
}

export function formatAttestationError(error: AttestationError): string {
  let message = `Attestation Error: ${error.message}`;
  
  if (error instanceof QuoteValidationError && error.details) {
    message += `\nDetails: ${JSON.stringify(error.details)}`;
  } else if (error instanceof ProviderUnavailableError) {
    message += error.reason ? `\nReason: ${error.reason}` : '';
  }

  return message;
}

export function isAttestationError(error: unknown): error is AttestationError {
  return error instanceof AttestationError;
}