import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import agentHandler from './src/pages/api/agentRouter.ts'
import orchestratorHandler from './src/pages/api/orchestrator.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-agent-router',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';
          const isAgent = url === '/api/agentRouter' || url.startsWith('/api/agentRouter?');
          const isOrchestrator = url === '/api/orchestrator' || url.startsWith('/api/orchestrator?');

          if (isAgent || isOrchestrator) {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });
            req.on('end', async () => {
              try {
                (req as any).body = body ? JSON.parse(body) : {};
                if (isAgent) {
                  await agentHandler(req, res);
                } else {
                  await orchestratorHandler(req, res);
                }
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})
