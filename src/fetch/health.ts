import { client } from "../config.js";
import { logger } from "../logger.js";
import * as prometheus from "../prometheus.js";

export default async function (req: Request) {
  try {
    const response = await client.ping();
    if (response.success === false) throw new Error(response.error.message);
    return new Response("OK");
  } catch (e: any) {
    logger.error(e);
    prometheus.request_error.inc({ pathname: "/health", status: 500});
    return new Response(e.message, { status: 500 });
  }
}