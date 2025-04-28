import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AttestationServiceProvider } from './types.js';
import { AlibabaAttestationService } from './services/alibaba-wrapper.js';
import { AttestationError, formatAttestationError } from './errors.js';

// Define schemas
export const VerifyQuoteSchema = z.object({
  provider: z.enum(['alibaba', 'trustee']),
  quote: z.string().describe('Base64 encoded quote'),
  nonce: z.string().optional().describe('Optional nonce for attestation'),
  options: z.object({}).passthrough().optional().describe('Provider-specific options')
});

export const GetServiceStatusSchema = z.object({
  provider: z.enum(['alibaba', 'trustee']),
});

export const SupportedTeeSchema = z.object({
  technology: z.enum(['tdx', 'sgx']),
});

export const FetchQuoteSchema = z.object({
    teeType: z.enum(['tdx', 'sgx']).optional().describe('TEE type (defaults to TDX)'),
    nonce: z.string().optional().describe('Optional nonce for attestation'),
    userData: z.string().optional().describe('Optional user data to include in the quote'),
  });
  
export const ParseQuoteSchema = z.object({
    quote: z.string().describe('Base64 encoded attestation quote'),
  });

// Service provider registry
const serviceProviders = {
  alibaba: new AlibabaAttestationService(),
  //trustee: new TrusteeAttestationService(),
};

// Request handler
export const handleRequest = {
  listTools: async () => {
    return {
      tools: [
        {
          name: "verify_quote",
          description: "Verify a quote using specified attestation service",
          inputSchema: zodToJsonSchema(VerifyQuoteSchema),
        },
        {
          name: "get_service_status",
          description: "Get status information about an attestation service",
          inputSchema: zodToJsonSchema(GetServiceStatusSchema),
        },
        {
          name: "supported_tee_types",
          description: "Get information about supported Trusted Exectution Environment(TEE) technologies by provider",
          inputSchema: zodToJsonSchema(SupportedTeeSchema),
        },
        {
            name: "fetch_quote",
            description: "Fetch an attestation quote from the local system",
            inputSchema: zodToJsonSchema(FetchQuoteSchema),
          },
          {
            name: "parse_quote",
            description: "Parse a binary attestation quote into structured JSON format",
            inputSchema: zodToJsonSchema(ParseQuoteSchema),
          },       
      ],
    };
  },

  callTool: async (request) => {
    try {
      if (!request.params.arguments) {
        throw new Error("Arguments are required");
      }

      switch (request.params.name) {
        case "verify_quote": {
          const args = VerifyTdxQuoteSchema.parse(request.params.arguments);
          const provider = serviceProviders[args.provider as AttestationServiceProvider];
          
          if (!provider) {
            throw new Error(`Unknown provider: ${args.provider}`);
          }
          
          const result = await provider.verifyQuote(args.quote, args.nonce, args.options);
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        
        case "get_service_status": {
          const args = GetServiceStatusSchema.parse(request.params.arguments);
          const provider = serviceProviders[args.provider as AttestationServiceProvider];
          
          if (!provider) {
            throw new Error(`Unknown provider: ${args.provider}`);
          }
          
          const status = await provider.getStatus();
          return {
            content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
          };
        }
        
        case "supported_tee_types": {
          const args = SupportedTeeSchema.parse(request.params.arguments);
          let result = {};
          
          if (args.technology === 'all') {
            // Gather all provider support information
            result = await Promise.all(
              Object.entries(serviceProviders).map(async ([name, provider]) => {
                const support = await provider.getSupportedTee();
                return { provider: name, ...support };
              })
            );
          } else {
            // Check specific technology support across providers
            result = await Promise.all(
              Object.entries(serviceProviders).map(async ([name, provider]) => {
                const support = await provider.isTeeSupported(args.technology);
                return { provider: name, technology: args.technology, supported: support };
              })
            );
          }
          
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        case "fetch_quote": {
            const args = FetchQuoteSchema.parse(request.params.arguments);
            const quote = await fetchLocalQuote(args.teeType || 'tdx', args.nonce, args.userData);
            return {
              content: [{ type: "text", text: JSON.stringify({ quote }, null, 2) }],
            };
        }
  
        case "parse_quote": {
            const args = ParseQuoteSchema.parse(request.params.arguments);
            const parsedQuote = await parseQuote(args.quote);
            return {
              content: [{ type: "text", text: JSON.stringify(parsedQuote, null, 2) }],
            };
        }
      
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      console.error("Error handling request:", error);
      
      if (error instanceof AttestationError) {
        return {
          error: {
            message: formatAttestationError(error),
          },
        };
      }
      
      return {
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
};