import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { authWorkflow } from './workflows';
import { authAgent } from './agents';
import { authTools } from './tools';

// Create Mastra instance
export const mastra = new Mastra({
  workflows: { authWorkflow },
  agents: { authAgent },
  tools: { authTools },
  logger: new PinoLogger({
    name: 'Smart-Auth-Orchestrator',
    level: 'info',
  }),
});

// Export the mastra instance as default
export default mastra;
