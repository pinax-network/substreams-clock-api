import { registry } from "../prometheus.js";
import openapi from "./openapi.js";
import health from "./health.js";
import chains from "./chains.js";
import block from "./block.js";

export default async function (req: Request) {
    const { pathname} = new URL(req.url);

    if ( pathname === "/" ) return new Response(Bun.file("./swagger/index.html"));
    if ( pathname === "/health" ) return health(req);
    if ( pathname === "/metrics" ) return new Response(await registry.metrics(), {headers: {"Content-Type": registry.contentType}});
    if ( pathname === "/openapi" ) return new Response(openapi, {headers: {"Content-Type": "application/json"}});
    if ( pathname === "/chains" ) return chains(req);
    if ( pathname === "/block" ) return block(req);

    return new Response("Not found", { status: 400 });
}
