import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

// Interfaces for type safety
export interface UserContext {
  email: string;
  deviceType: 'mobile' | 'desktop';
  browser: string;
  ipCountry: string;
  isVPN: boolean;
  ipAddress: string;
}

export interface AuthMethod {
  method: 'password' | 'mfa';
  reason: string;
  requiresMFA: boolean;
}

export interface AuthDecision {
  riskScore: number;
  authMethod: AuthMethod;
  userContext: UserContext;
  timestamp: string;
}

// Create the authentication agent using Mastra's Agent class
export const authAgent = new Agent({
  name: 'Smart Authentication Agent',
  description: 'Intelligently assesses user risk and determines authentication method',
  inputSchema: z.object({
    userContext: z.object({
      email: z.string(),
      deviceType: z.enum(['mobile', 'desktop']),
      browser: z.string(),
      ipCountry: z.string(),
      isVPN: z.boolean(),
      ipAddress: z.string()
    }),
    credentials: z.object({
      email: z.string(),
      password: z.string()
    })
  }),
  outputSchema: z.object({
    riskScore: z.number(),
    authMethod: z.object({
      method: z.enum(['password', 'mfa']),
      reason: z.string(),
      requiresMFA: z.boolean()
    }),
    userContext: z.object({
      email: z.string(),
      deviceType: z.enum(['mobile', 'desktop']),
      browser: z.string(),
      ipCountry: z.string(),
      isVPN: z.boolean(),
      ipAddress: z.string()
    }),
    timestamp: z.string()
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { userContext, credentials } = inputData;
    const riskThreshold = 50; // Score above this triggers MFA

    // Risk Assessment
    let riskScore = 0;
    
    // Device risk (new/unknown devices = higher risk)
    if (userContext.deviceType === 'mobile') riskScore += 20;
    if (userContext.browser === 'unknown') riskScore += 30;
    
    // Location risk (unusual locations = higher risk)
    if (userContext.ipCountry !== 'US') riskScore += 25;
    if (userContext.isVPN) riskScore += 40;
    
    // User type risk (admin = higher risk)
    if (userContext.email.includes('admin')) riskScore += 35;
    
    riskScore = Math.min(riskScore, 100);

    // Method Selection
    const authMethod = riskScore >= riskThreshold ? {
      method: 'mfa' as const,
      reason: `High risk score: ${riskScore}`,
      requiresMFA: true
    } : {
      method: 'password' as const,
      reason: `Low risk score: ${riskScore}`,
      requiresMFA: false
    };

    return {
      riskScore,
      authMethod,
      userContext,
      timestamp: new Date().toISOString()
    };
  }
});
