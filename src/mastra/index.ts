import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { authWorkflow } from './workflows';

export const mastra = new Mastra({
  workflows: { authWorkflow },
  logger: new PinoLogger({
    name: 'Smart-Auth-Orchestrator',
    level: 'info',
  }),
});
