import { config } from "./src/config.js";
import { logger } from "./src/logger.js";
import GET from "./src/fetch/GET.js";
import OPTIONS from "./src/fetch/OPTIONS.js";
import * as prometheus from "./src/prometheus.js";
import { BadRequest } from "./src/fetch/cors.js";

if (config.verbose) logger.enable();

const app = Bun.serve({
    hostname: config.hostname,
    port: config.port,
    fetch(req: Request) {
        if (req.method === "GET") return GET(req);
        if (req.method === "OPTIONS") return OPTIONS(req);
        prometheus.request_error.inc({pathname: new URL(req.url).pathname, status: 400});
        return BadRequest
    }
});

logger.info(`Server listening on http://${app.hostname}:${app.port}`);