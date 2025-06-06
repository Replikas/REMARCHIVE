import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import fs from "fs";
import * as cron from "node-cron";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Production logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const pathUrl = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathUrl.startsWith("/api")) {
      let logLine = `${req.method} ${pathUrl} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`[${new Date().toISOString()}] ${logLine}`);
    }
  });

  next();
});

// Production static file serving
function serveStatic(app: express.Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.error(`Build directory not found: ${distPath}`);
    console.error("Available directories:", fs.readdirSync(process.cwd()));
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files with proper caching headers
  app.use(express.static(distPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true
  }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Catch-all handler for SPA routing
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

(async () => {
  try {
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`[ERROR] ${status}: ${message}`, err.stack);
      res.status(status).json({ message });
    });

    // Serve static files in production
    serveStatic(app);

    // Use Render's PORT environment variable
    const port = parseInt(process.env.PORT || "5000", 10);
    
    server.listen(port, "0.0.0.0", () => {
      console.log(`[${new Date().toISOString()}] Server running on port ${port}`);
      console.log(`[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV}`);
      console.log(`[${new Date().toISOString()}] Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
      
      // Anti-sleep ping mechanism - ping every 14 minutes to prevent Render free tier sleep
      const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
      
      cron.schedule('*/14 * * * *', async () => {
        try {
          const response = await fetch(`${baseUrl}/health`, {
            method: 'GET',
            timeout: 10000 // 10 second timeout
          });
          
          if (response.ok) {
            console.log(`[${new Date().toISOString()}] Anti-sleep ping successful`);
          } else {
            console.log(`[${new Date().toISOString()}] Anti-sleep ping failed with status: ${response.status}`);
          }
        } catch (error) {
          console.log(`[${new Date().toISOString()}] Anti-sleep ping error:`, error.message);
        }
      });
      
      console.log(`[${new Date().toISOString()}] Anti-sleep ping scheduled every 14 minutes`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[SIGTERM] Shutting down gracefully...');
      server.close(() => {
        console.log('[SIGTERM] Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();