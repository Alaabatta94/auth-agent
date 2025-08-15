# Smart Authentication Orchestrator

A minimal authentication system that intelligently chooses between simple password and MFA based on risk assessment. Built as a Mastra template with TypeScript.

## 🏗️ Project Structure

```
src/mastra/
├── agents/          # Intelligent authentication decision engine
├── tools/           # Authentication utilities and providers
├── workflows/       # Main authentication orchestration
└── index.ts         # Main entry point and server
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start

# Or run in development mode
npm run dev
```

## 🔐 Demo Endpoints

- `POST /auth/login` - Smart authentication
- `GET /auth/verify` - Verify session
- `GET /dashboard` - Protected resource
- `POST /demo/risk-assessment` - Risk analysis demo

## 🧪 How it Works

1. **Risk Assessment**: Analyzes device + location + user type
2. **Method Selection**: Password (low risk) or MFA (high risk)
3. **Authentication**: Executes chosen method with session management

## 👥 Test Users

- `user@lowrisk.com` (password: `password123`) - Simple auth
- `admin@highrisk.com` (password: `admin123`) - MFA required (code: `654321`)

## 🎯 Demo Interface

Open `demo.html` in your browser to test the system with a beautiful UI!

## 📦 Mastra Template Components

### Agent (`src/mastra/agents/`)
- Risk assessment algorithm
- Authentication method selection
- Context-aware decision making

### Tools (`src/mastra/tools/`)
- Password verification with bcrypt
- MFA code generation and validation
- JWT token management
- Context extraction utilities

### Workflow (`src/mastra/workflows/`)
- Orchestrates the entire authentication process
- Handles both simple and MFA flows
- Session management and verification

## 🔧 Development

```bash
# Watch for changes
npm run watch

# Run tests (when added)
npm test
```

## 📝 API Examples

### Login Request
```json
{
  "email": "user@lowrisk.com",
  "password": "password123"
}
```

### MFA Response
```json
{
  "success": false,
  "requiresMFA": true,
  "riskScore": 75,
  "reason": "High risk score: 75"
}
```

### Success Response
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "email": "user@lowrisk.com",
    "role": "user"
  },
  "authInfo": {
    "riskScore": 25,
    "method": "password",
    "reason": "Low risk score: 25"
  }
}
```
