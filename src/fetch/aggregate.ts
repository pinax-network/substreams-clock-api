import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { NormalizedHistoryData, getAggregate } from "../queries.js";
import * as prometheus from "../prometheus.js";
import { BadRequest, toJSON } from "./cors.js";
import { parseNormalized, verifyParameters } from "../utils.js";

// endpoint for aggregates (trace_calls, transaction_traces, uaw)
export default async function (req: Request, pathname: string) {
  // verify some crucial parameters beforehand
  const parametersResult = await verifyParameters(req);
  if(parametersResult instanceof Response) {
    return parametersResult;
  }
  try {
    const { searchParams } = new URL(req.url);
    logger.info({searchParams: Object.fromEntries(Array.from(searchParams))});
    // creates the query for requested aggregate column based on pathname
    const query = getAggregate(searchParams, pathname.replace("/", ""));
    const response = await makeQuery<NormalizedHistoryData>(query)
    // formats the response into daily intervals
    const formatted = parseNormalized(response.data, 86400);
    return toJSON(formatted);
  } catch (e: any) {
    logger.error(e);
    prometheus.request_error.inc({pathname: pathname, status: 400});
    return BadRequest
  }
}