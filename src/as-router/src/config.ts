export const CONFIG = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
  },
  
  // Log configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  // Service provider endpoints
  providers: {
    alibaba: {
      endpoint: process.env.ALIBABA_ATTESTATION_ENDPOINT || 'attest.cn-beijing.aliyuncs.com/v1/attestation',
      apiKey: process.env.ALIBABA_API_KEY || 'none',
      apiSecret: process.env.ALIBABA_API_SECRET || 'none',
    },
    custom: {
      endpoint: process.env.CUSTOM_ATTESTATION_ENDPOINT || 'http://localhost:8080',
      trusteeEndpoint: process.env.TRUSTEE_ENDPOINT || 'http://localhost:8081',
      apiKey: process.env.CUSTOM_API_TOKEN || 'none',
      apiToken: process.env.CUSTOM_API_TOKEN || 'none',
    }
  }
};