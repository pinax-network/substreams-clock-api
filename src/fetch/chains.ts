import { supportedChainsQuery } from "../queries.js";

export default async function (req: Request) {
  try {
    const chains = await supportedChainsQuery();
    return new Response(JSON.stringify(chains), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(e.message, { status: 400 });
  }
}