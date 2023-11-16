import { registry } from "../prometheus.js";
import openapi from "./openapi.js";
import health from "./health.js";
import chains from "./chains.js";
import block from "./block.js";
import aggregate from "./aggregate.js";
import uaw from "./uaw.js";
import history from "./history.js";
import * as prometheus from "../prometheus.js";
import { logger } from "../logger.js";
import swaggerHtml from "../../swagger/index.html"
import swaggerFavicon from "../../swagger/favicon.png"
import { NotFound, toFile, toJSON, toText } from "./cors.js";

export default async function (req: Request) {
    const { pathname} = new URL(req.url);
    prometheus.request.inc({pathname});
    if ( pathname === "/" ) return toFile(Bun.file(swaggerHtml));
    if ( pathname === "/favicon.png" ) return toFile(Bun.file(swaggerFavicon));
    if ( pathname === "/health" ) return health(req);
    if ( pathname === "/metrics" ) return toText(await registry.metrics());
    if ( pathname === "/openapi" ) return toJSON(openapi);
    if ( pathname === "/chains" ) return chains();
    if ( pathname === "/block" ) return block(req);
    if ( pathname === "/trace_calls" ) return aggregate(req, pathname);
    if ( pathname === "/transaction_traces" ) return aggregate(req, pathname);
    if ( pathname === "/uaw" ) return uaw(req);
    if ( pathname === "/uaw/history" ) return history(req);
    logger.warn(`Not found: ${pathname}`);
    prometheus.request_error.inc({pathname, status: 404});
    return NotFound;
}
