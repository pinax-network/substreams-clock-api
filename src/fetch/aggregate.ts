import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { getAggregate } from "../queries.js";
import * as prometheus from "../prometheus.js";
import { BadRequest, toJSON } from "./cors.js";
import { verifyParameters } from "../utils.js";

export default async function (req: Request, pathname: string) {
  const parametersResult = await verifyParameters(req);
  if(parametersResult instanceof Response) {
    return parametersResult;
  }
  try {
    const { searchParams } = new URL(req.url);
    logger.info({searchParams: Object.fromEntries(Array.from(searchParams))});
    const query = getAggregate(searchParams, pathname.replace("/", ""));
    const response = await makeQuery<number>(query)
    return toJSON(response.data);
  } catch (e: any) {
    logger.error(e);
    prometheus.request_error.inc({pathname: pathname, status: 400});
    return BadRequest
  }
}