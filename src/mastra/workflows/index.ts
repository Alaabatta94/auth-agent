import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Demo users for testing
const demoUsers: Record<string, { password: string; role: string; mfaSecret: string }> = {
  'user@lowrisk.com': {
    password: bcrypt.hashSync('password123', 10),
    role: 'user',
    mfaSecret: '123456'
  },
  'admin@highrisk.com': {
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    mfaSecret: '654321'
  }
};

const secret = process.env.JWT_SECRET || 'hackathon-secret-key';

// Single authentication step that does everything
const authenticateUser = createStep({
  id: 'authenticate-user',
  description: 'Authenticates user with risk assessment and optional MFA',
  inputSchema: z.object({
    email: z.string().email(),
    password: z.string(),
    mfaCode: z.string().optional(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional()
  }),
  outputSchema: z.object({
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
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { email, password, mfaCode, userAgent } = inputData;

    // Step 1: Risk Assessment
    let riskScore = 0;
    if (userAgent?.includes('Mobile')) riskScore += 20;
    if (email.includes('admin')) riskScore += 35;
    riskScore = Math.min(riskScore, 100);
    const requiresMFA = riskScore >= 50;

    // Step 2: Password Verification
    const user = demoUsers[email];
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // Step 3: MFA Check
    if (requiresMFA) {
      if (!mfaCode) {
        return {
          success: false,
          requiresMFA: true,
          message: 'MFA code required',
          error: `High risk score: ${riskScore}`
        };
      }

      const isValidMFA = mfaCode === user.mfaSecret;
      if (!isValidMFA) {
        return {
          success: false,
          error: 'Invalid MFA code'
        };
      }
    }

    // Step 4: Generate Token
    const token = jwt.sign({
      email,
      role: user.role,
      riskScore,
      authMethod: requiresMFA ? 'mfa' : 'password'
    }, secret, { expiresIn: '1h' });

    return {
      success: true,
      token,
      user: {
        email,
        role: user.role
      },
      authInfo: {
        riskScore,
        method: requiresMFA ? 'mfa' : 'password',
        reason: requiresMFA ? `High risk score: ${riskScore}` : `Low risk score: ${riskScore}`
      }
    };
  }
});

// Create the authentication workflow
const authWorkflow = createWorkflow({
  id: 'smart-auth-orchestrator',
  inputSchema: z.object({
    email: z.string().email(),
    password: z.string(),
    mfaCode: z.string().optional(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional()
  }),
  outputSchema: z.object({
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
  })
})
.then(authenticateUser);

authWorkflow.commit();

export { authWorkflow };
