import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { authAgent } from '../agents';
import { authTools } from '../tools';

// Input schema for authentication
const authInputSchema = z.object({
  email: z.string().email().describe('User email address'),
  password: z.string().describe('User password'),
  mfaCode: z.string().optional().describe('MFA code if required'),
  userAgent: z.string().optional().describe('User agent string'),
  ipAddress: z.string().optional().describe('User IP address')
});

// Output schema for authentication result
const authOutputSchema = z.object({
  success: z.boolean(),
  token: z.string().optional(),
  user: z.object({
    email: z.string(),
    role: z.string()
  }).optional(),
  authInfo: z.object({
    riskScore: z.number(),
    method: z.string(),
    reason: z.string()
  }).optional(),
  requiresMFA: z.boolean().optional(),
  message: z.string().optional(),
  error: z.string().optional()
});

// Step 1: Risk Assessment
const assessRisk = createStep({
  id: 'assess-risk',
  description: 'Assesses user risk based on context and credentials',
  inputSchema: authInputSchema,
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
    })
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    // Extract context
    const userContext = {
      email: inputData.email,
      deviceType: inputData.userAgent?.includes('Mobile') ? 'mobile' : 'desktop',
      browser: 'chrome', // Simplified for demo
      ipCountry: 'US', // Simplified for demo
      isVPN: false, // Simplified for demo
      ipAddress: inputData.ipAddress || '127.0.0.1'
    };

    // Get risk assessment from agent
    const authDecision = await authAgent.execute({
      inputData: {
        userContext,
        credentials: { 
          email: inputData.email, 
          password: inputData.password 
        }
      }
    });

    return {
      riskScore: authDecision.outputData.riskScore,
      authMethod: authDecision.outputData.authMethod,
      userContext
    };
  }
});

// Step 2: Authenticate User
const authenticateUser = createStep({
  id: 'authenticate-user',
  description: 'Authenticates user with password and optional MFA',
  inputSchema: z.object({
    email: z.string(),
    password: z.string(),
    mfaCode: z.string().optional(),
    riskAssessment: z.object({
      riskScore: z.number(),
      authMethod: z.object({
        method: z.enum(['password', 'mfa']),
        reason: z.string(),
        requiresMFA: z.boolean()
      })
    })
  }),
  outputSchema: authOutputSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { email, password, mfaCode, riskAssessment } = inputData;

    // Verify password
    if (!authTools.verifyPassword(email, password)) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // Check if MFA is required
    if (riskAssessment.authMethod.requiresMFA) {
      if (!mfaCode) {
        return {
          success: false,
          requiresMFA: true,
          message: 'MFA code required',
          error: riskAssessment.authMethod.reason
        };
      }
      
      if (!authTools.verifyMFACode(email, mfaCode)) {
        return {
          success: false,
          error: 'Invalid MFA code'
        };
      }
    }

    // Generate session token
    const userRole = authTools.getUserRole(email);
    if (!userRole) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const token = authTools.generateToken({
      email,
      role: userRole,
      riskScore: riskAssessment.riskScore,
      authMethod: riskAssessment.authMethod.method
    });

    return {
      success: true,
      token,
      user: {
        email,
        role: userRole
      },
      authInfo: {
        riskScore: riskAssessment.riskScore,
        method: riskAssessment.authMethod.method,
        reason: riskAssessment.authMethod.reason
      }
    };
  }
});

// Create the main authentication workflow
export const authWorkflow = createWorkflow({
  id: 'smart-auth-orchestrator',
  name: 'Smart Authentication Orchestrator',
  description: 'Intelligently authenticates users based on risk assessment',
  inputSchema: authInputSchema,
  outputSchema: authOutputSchema,
  steps: [assessRisk, authenticateUser],
  execute: async ({ inputData, steps }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    // Step 1: Assess risk
    const riskAssessment = await steps.assessRisk.execute({ inputData });

    // Step 2: Authenticate user
    const authResult = await steps.authenticateUser.execute({
      inputData: {
        email: inputData.email,
        password: inputData.password,
        mfaCode: inputData.mfaCode,
        riskAssessment: riskAssessment.outputData
      }
    });

    return authResult.outputData;
  }
});
