import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { UAWHistory, getUAWHistory } from "../queries.js";
import * as prometheus from "../prometheus.js";
import { BadRequest, toJSON } from "./cors.js";
import { parseUAWResponse, verifyParameters } from "../utils.js";

export default async function (req: Request) {
  const parametersResult = await verifyParameters(req);
  if(parametersResult instanceof Response) {
    return parametersResult;
  }
  try {
    const { searchParams } = new URL(req.url);
    logger.info({searchParams: Object.fromEntries(Array.from(searchParams))});
    const query = getUAWHistory(searchParams);
    const response = await makeQuery<UAWHistory>(query)
    const formatted = parseUAWResponse(response.data);
    return toJSON(formatted);
  } catch (e: any) {
    logger.error(e);
    prometheus.request_error.inc({pathname: "/uaw/history", status: 400});
    return BadRequest
  }
}