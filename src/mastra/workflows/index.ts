// Authentication Workflow
import { Request, Response } from 'express';
import { AuthAgent, AuthDecision } from '../agents';
import { AuthTools, UserData } from '../tools';

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: {
    email: string;
    role: string;
  };
  authInfo?: {
    riskScore: number;
    method: string;
    reason: string;
  };
  requiresMFA?: boolean;
  message?: string;
  riskScore?: number;
  reason?: string;
  error?: string;
}

export interface SessionResult {
  valid: boolean;
  user?: UserData;
  error?: string;
}

export class AuthWorkflow {
  private agent: AuthAgent;
  private tools: AuthTools;

  constructor() {
    this.agent = new AuthAgent();
    this.tools = new AuthTools();
  }

  // Main workflow execution
  async execute(req: Request, res: Response): Promise<AuthResult> {
    try {
      const { email, password, mfaCode } = req.body;
      
      // Step 1: Extract context
      const userContext = this.tools.extractContext(req);
      
      // Step 2: Agent makes authentication decision
      const authDecision = this.agent.authenticate(userContext, { email, password });
      
      // Step 3: Execute authentication based on decision
      const result = await this.executeAuthentication(authDecision, { email, password, mfaCode });
      
      return result;
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Execute the chosen authentication method
  private async executeAuthentication(authDecision: AuthDecision, credentials: { email: string; password: string; mfaCode?: string }): Promise<AuthResult> {
    const { email, password, mfaCode } = credentials;
    
    // Verify password first
    if (!this.tools.verifyPassword(email, password)) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // Check if MFA is required
    if (authDecision.authMethod.requiresMFA) {
      if (!mfaCode) {
        return {
          success: false,
          requiresMFA: true,
          message: 'MFA code required',
          riskScore: authDecision.riskScore,
          reason: authDecision.authMethod.reason
        };
      }
      
      if (!this.tools.verifyMFACode(email, mfaCode)) {
        return {
          success: false,
          error: 'Invalid MFA code'
        };
      }
    }

    // Generate session token
    const userRole = this.tools.getUserRole(email);
    if (!userRole) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const token = this.tools.generateToken({
      email,
      role: userRole,
      riskScore: authDecision.riskScore,
      authMethod: authDecision.authMethod.method
    });

    return {
      success: true,
      token,
      user: {
        email,
        role: userRole
      },
      authInfo: {
        riskScore: authDecision.riskScore,
        method: authDecision.authMethod.method,
        reason: authDecision.authMethod.reason
      }
    };
  }

  // Verify session token
  verifySession(token: string): SessionResult {
    const decoded = this.tools.verifyToken(token);
    if (!decoded) {
      return { valid: false, error: 'Invalid token' };
    }
    return { valid: true, user: decoded };
  }

  // Get agent for external access
  getAgent(): AuthAgent {
    return this.agent;
  }

  // Get tools for external access
  getTools(): AuthTools {
    return this.tools;
  }
}
