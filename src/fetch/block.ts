import { config } from "../config.js";
import { getBlock } from "../queries.js";

export default async function (req: Request) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get("chain");
  const block_number = searchParams.get("block_number");
  const block_id = searchParams.get("block_id");
  const timestamp = searchParams.get("timestamp");
  let limit = parseInt(searchParams.get("limit") ?? "500");
  const params: any = { chain, block_number, block_id, timestamp, limit };
  if ( limit > config.maxElementsQueried ) limit = config.maxElementsQueried;

  // TO-DO: Max block number
  // TO-DO: sort by DESC/ASC (default DESC)
  try {
    const response = await getBlock(params);
    return new Response(JSON.stringify(response.data), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(e.message, { status: 400 });
  }
}