import { makeQuery } from "../clickhouse/makeQuery.js";
import { logger } from "../logger.js";
import { Block, getBlock } from "../queries.js";

export default async function (req: Request) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get("chain");
  const block_number = searchParams.get("block_number");
  const block_id = searchParams.get("block_id");
  const timestamp = searchParams.get("timestamp");
  const limit = searchParams.get("limit");

  // TO-DO: Max block number
  try {
    const params = { chain, block_number, block_id, timestamp, limit };
    const query = await getBlock(params);
    const response = await makeQuery<Block>(query)
    logger.info('getBlock', {params, query});
    return new Response(JSON.stringify(response.data), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(e.message, { status: 400 });
  }
}