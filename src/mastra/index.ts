// Main Server - Smart Authentication Orchestrator
import express from 'express';
import cors from 'cors';
import { AuthWorkflow } from './workflows';

// Export all components for external use
export { AuthAgent } from './agents';
export { AuthTools } from './tools';
export { AuthWorkflow } from './workflows';
export type { UserContext, AuthMethod, AuthDecision } from './agents';
export type { User, UserData } from './tools';
export type { AuthResult, SessionResult } from './workflows';

// Express server setup
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize workflow
const authWorkflow = new AuthWorkflow();

// Routes
app.post('/auth/login', async (req, res) => {
  const result = await authWorkflow.execute(req, res);
  res.json(result);
});

app.get('/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const result = authWorkflow.verifySession(token);
  res.json(result);
});

app.get('/dashboard', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const session = authWorkflow.verifySession(token);
  if (!session.valid) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  res.json({
    message: 'Welcome to the dashboard!',
    user: session.user,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Smart Authentication Orchestrator',
    timestamp: new Date().toISOString()
  });
});

// Demo endpoint to show risk assessment
app.post('/demo/risk-assessment', (req, res) => {
  const userContext = authWorkflow.getTools().extractContext(req);
  const riskScore = authWorkflow.getAgent().assessRisk(userContext);
  const authMethod = authWorkflow.getAgent().selectAuthMethod(riskScore, userContext);
  
  res.json({
    userContext,
    riskScore,
    authMethod,
    timestamp: new Date().toISOString()
  });
});

// Start server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Smart Authentication Orchestrator running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Demo endpoints:`);
    console.log(`   POST /auth/login - Smart authentication`);
    console.log(`   GET /auth/verify - Verify session`);
    console.log(`   GET /dashboard - Protected resource`);
    console.log(`   POST /demo/risk-assessment - Risk analysis`);
    console.log(`\n👥 Test users:`);
    console.log(`   user@lowrisk.com / password123 (Simple auth)`);
    console.log(`   admin@highrisk.com / admin123 (MFA required)`);
  });
}
