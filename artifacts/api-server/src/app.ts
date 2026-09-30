import path from "node:path";
import fs from "node:fs";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve the built storefront (vite build output) so one process hosts the
// whole shop: API under /api/*, everything else serves the SPA.
// The frontend builds to artifacts/misopretty-seeds/dist/public.
const clientDist = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "misopretty-seeds",
  "dist",
  "public",
);
if (fs.existsSync(path.join(clientDist, "index.html"))) {
  app.use(express.static(clientDist));
  // SPA fallback: client-side routes (e.g. /checkout/success) serve index.html.
  // Must come AFTER /api so API routes are never shadowed.
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
  logger.info({ clientDist }, "Serving storefront from");
} else {
  logger.info(
    "Storefront build not found — running API-only. " +
      "Build the frontend to enable the full shop.",
  );
}

export default app;
