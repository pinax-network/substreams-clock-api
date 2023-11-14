import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { getDAW } from "../queries.js";
import * as prometheus from "../prometheus.js";
import { BadRequest, toJSON } from "./cors.js";

export default async function (req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    logger.info({searchParams: Object.fromEntries(Array.from(searchParams))});
    const query = await getDAW(searchParams);
    const response = await makeQuery<number>(query)
    return toJSON(response.data);
  } catch (e: any) {
    logger.error(e);
    prometheus.request_error.inc({pathname: "/uaw", status: 400});
    return BadRequest
  }
}