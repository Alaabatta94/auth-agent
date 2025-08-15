// Smart Authentication Agent
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

export class AuthAgent {
  private riskThreshold: number = 50; // Score above this triggers MFA

  // Step 1: Risk Assessment
  assessRisk(userContext: UserContext): number {
    let riskScore = 0;
    
    // Device risk (new/unknown devices = higher risk)
    if (userContext.deviceType === 'mobile') riskScore += 20;
    if (userContext.browser === 'unknown') riskScore += 30;
    
    // Location risk (unusual locations = higher risk)
    if (userContext.ipCountry !== 'US') riskScore += 25;
    if (userContext.isVPN) riskScore += 40;
    
    // User type risk (admin = higher risk)
    if (userContext.email.includes('admin')) riskScore += 35;
    
    return Math.min(riskScore, 100);
  }

  // Step 2: Method Selection
  selectAuthMethod(riskScore: number, userContext: UserContext): AuthMethod {
    if (riskScore >= this.riskThreshold) {
      return {
        method: 'mfa',
        reason: `High risk score: ${riskScore}`,
        requiresMFA: true
      };
    } else {
      return {
        method: 'password',
        reason: `Low risk score: ${riskScore}`,
        requiresMFA: false
      };
    }
  }

  // Step 3: Authentication Decision
  authenticate(userContext: UserContext, credentials: { email: string; password: string }): AuthDecision {
    const riskScore = this.assessRisk(userContext);
    const authMethod = this.selectAuthMethod(riskScore, userContext);
    
    return {
      riskScore,
      authMethod,
      userContext,
      timestamp: new Date().toISOString()
    };
  }
}

// Export an instance for Mastra
export const authAgent = new AuthAgent();
