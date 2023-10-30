import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import * as prometheus from "../prometheus.js";
import { getChain } from "../queries.js";
import { BadRequest, toJSON } from "./cors.js";

export async function supportedChainsQuery() {
  const response = await makeQuery<{chain: string}>(getChain());
  return response.data.map((r) => r.chain);
}

export default async function (req: Request) {
  try {
    const chains = await supportedChainsQuery();
    return toJSON(chains);
  } catch (e: any) {
    logger.error(e);
    prometheus.request_error.inc({pathname: "/chains", status: 400});
    return BadRequest;
  }
}