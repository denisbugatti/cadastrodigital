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
  // Vitacon-only: the One brand is RETIRED. Any page on the One host, the apex
  // or www redirects to the Vitacon host preserving path + query — home, login,
  // dashboard and form links alike (one/alves -> vitacon/alves). Forms stay in
  // the DB; only the One surface goes away. /api is NOT redirected so callbacks
  // and health checks keep answering on any host.
  const RETIRED_HOSTS = new Set([
    "one.cadastrodigital.com.br",
    "cadastrodigital.com.br",
    "www.cadastrodigital.com.br",
  ]);
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    const host = (req.headers.host || "").toLowerCase().split(":")[0];
    if (!RETIRED_HOSTS.has(host)) return next();
    if (req.path.startsWith("/api")) return next();
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
