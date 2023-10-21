import { config } from "./src/config";
import { logger } from "./src/logger";
import GET from "./src/fetch/GET";

if (config.verbose) logger.enable();

const app = Bun.serve({
    hostname: config.hostname,
    port: config.port,
    fetch(req: Request) {
        if (req.method === "GET") return GET(req);
        return new Response("Invalid request", { status: 400 });
    }
});

logger.info(`Server listening on http://${app.hostname}:${app.port}`);