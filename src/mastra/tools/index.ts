// Authentication Tools
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { UserContext } from '../agents';

export interface User {
  password: string;
  role: string;
  mfaSecret: string;
}

export interface UserData {
  email: string;
  role: string;
  riskScore: number;
  authMethod: string;
}

export class AuthTools {
  private secret: string;
  private users: Record<string, User>;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'hackathon-secret-key';
    this.users = this.initializeUsers();
  }

  // Initialize demo users
  private initializeUsers(): Record<string, User> {
    return {
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
  }

  // Password verification
  verifyPassword(email: string, password: string): boolean {
    const user = this.users[email];
    if (!user) return false;
    return bcrypt.compareSync(password, user.password);
  }

  // MFA code generation (simplified - in real app use proper TOTP)
  generateMFACode(secret: string): string {
    // Simple demo: use last 6 digits of timestamp
    return Date.now().toString().slice(-6);
  }

  // MFA verification
  verifyMFACode(email: string, code: string): boolean {
    const user = this.users[email];
    if (!user) return false;
    
    // Demo: accept the secret as valid code
    return code === user.mfaSecret;
  }

  // Session token generation
  generateToken(userData: UserData): string {
    return jwt.sign(userData, this.secret, { expiresIn: '1h' });
  }

  // Session token verification
  verifyToken(token: string): UserData | null {
    try {
      return jwt.verify(token, this.secret) as UserData;
    } catch (error) {
      return null;
    }
  }

  // Context extraction from request
  extractContext(req: Request): UserContext {
    return {
      email: req.body.email || '',
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
      browser: this.detectBrowser(req.headers['user-agent'] || ''),
      ipCountry: 'US', // Demo: assume US
      isVPN: false, // Demo: assume no VPN
      ipAddress: req.ip || req.connection.remoteAddress || ''
    };
  }

  // Simple browser detection
  private detectBrowser(userAgent: string): string {
    if (!userAgent) return 'unknown';
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    return 'unknown';
  }

  // Get user role
  getUserRole(email: string): string | null {
    const user = this.users[email];
    return user ? user.role : null;
  }
}

// Export an instance for Mastra
export const authTools = new AuthTools();
