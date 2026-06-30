import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { warmUpDb } from "../db";
import { runSeeds } from "../seedMaster";
import { ogMiddleware } from "../ogMiddleware";
import { startCronScheduler } from "../cronScheduler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Vitacon-only: public form links on the One host (one.cadastrodigital.com.br/<slug>)
  // redirect to the Vitacon host (302). App routes (/dashboard, /corretor/*, /api, assets)
  // and the bare root stay on One so the admin/corretor panel keeps working there.
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    const host = (req.headers.host || "").toLowerCase().split(":")[0];
    if (host !== "one.cadastrodigital.com.br") return next();
    const slugMatch = req.path.match(/^\/([a-z0-9][a-z0-9_-]{0,60})$/i);
    if (!slugMatch) return next();
    const slug = slugMatch[1].toLowerCase();
    const APP_ROUTES = new Set([
      "login", "dashboard", "editor", "responses", "equipe", "configuracoes",
      "validar", "aceitar-convite", "404", "portal", "cadastro-cliente",
      "api", "assets", "sw.js", "manifest.json", "robots.txt",
    ]);
    if (APP_ROUTES.has(slug)) return next();
    return res.redirect(302, `https://vitacon.cadastrodigital.com.br${req.originalUrl}`);
  });

  // OG meta tags for social media crawlers (must be before SPA fallback)
  app.use(ogMiddleware());

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Warm up database connection at startup and run seeds
  warmUpDb()
    .then(async (ok) => {
      if (ok) {
        try { await runSeeds(); } catch (e: any) {
          console.warn("[Server] Seed failed:", e?.message?.substring(0, 80));
        }
        // Start the email cadence cron scheduler after DB is ready.
        // Gated by ENABLE_CRON so deploys can boot without contacting real clients.
        if (process.env.ENABLE_CRON === "true") {
          startCronScheduler();
        } else {
          console.log("[Cron] Disabled (set ENABLE_CRON=true to enable)");
        }
      }
    })
    .catch(() => console.warn("[Server] DB warm-up failed, will retry on first request"));

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
