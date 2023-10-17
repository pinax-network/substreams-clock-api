import { z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';

import config from './config';
import { BlockchainSchema, BlocktimeQueryResponseSchema, BlocktimeQueryResponsesSchema, SingleBlocknumQueryResponseSchema } from './schemas';

// Describe the default returned data format `JSONObjectEachRow` from the Clickhouse DB
type JSONObjectEachRow = {
    [key: string]: {
        [key: string]: Array<string>
    }
};

async function makeQuery(query: string, format: string = 'JSONObjectEachRow'): Promise<any> {
    const response = await fetch(`${config.dbHost}/?default_format=${format}`, {
        method: "POST",
        body: query,
        headers: { "Content-Type": "text/plain" },
    }).catch((error) => {
        throw new HTTPException(503, {
            message: `(${error.path}) ${error} -- Check /health for API status.`
        });
    });

    const body = await response.text();
    let json;

    try {
        json = JSON.parse(body);
    } catch {
        throw new HTTPException(500, {
            message: `Error parsing JSON from DB response: ${body} -- Check /health for API status.`
        });
    }

    return json;
}

function parseBlockTimeQueryResponse(json: JSONObjectEachRow): BlocktimeQueryResponsesSchema {
    return BlocktimeQueryResponsesSchema.parse(
        Object.values(json as JSONObjectEachRow).map((r: {
            [key: string]: Array<string>
        }) => {
        return BlocktimeQueryResponseSchema.parse({
            chain: Object.values(r)[0][0],
            block_number: Object.values(r)[0][1],
            timestamp: Object.values(r)[0][2]
        });
    }));
}

export async function timestampQuery(chain: string, block_number: number | number[]): Promise<BlocktimeQueryResponsesSchema> {
    const query = `SELECT (chain, block_number, timestamp) FROM ${config.name} WHERE (chain == '${chain}') AND (block_number IN (${block_number.toString()}))`;
    const json = await makeQuery(query);
    
    return parseBlockTimeQueryResponse(json);
}

export async function blocknumQuery(chain: string, timestamp: Date | Date[]): Promise<BlocktimeQueryResponsesSchema> {
    timestamp = Array.isArray(timestamp) ? timestamp : [timestamp];
    const query = `SELECT (chain, block_number, timestamp) FROM ${config.name} WHERE (chain == '${chain}') AND (timestamp IN (${
        timestamp.map((t) => '\'' + t.toISOString().replace('T', ' ').substring(0, 19) + '\'').toString() // Format dates to find them in DB (mock data)
    }))`; // TODO: Find closest instead of matching timestamp or another route ?
    const json = await makeQuery(query);

    return parseBlockTimeQueryResponse(json)
}

export async function currentBlocknumQuery(chain: string) {
    const query = `SELECT MAX(block_number) AS current FROM ${config.name} GROUP BY chain HAVING (chain == '${chain}')`;
    const json = await makeQuery(query);

    return SingleBlocknumQueryResponseSchema.parse({
        chain,
        block_number: Object.values(json as JSONObjectEachRow)[0].current,
    });
}

export async function finalBlocknumQuery(chain: string) {
    /*const query = `SELECT MAX(block_number) as final FROM ${config.name} GROUP BY chain HAVING (chain == '${chain}')`;
    const json = await makeQuery(query);

    return SingleBlocknumQueryResponseSchema.parse({
        chain
        block_number: Object.values(json as JSONObjectEachRow)[0].final,
    });
    */
    return { todo: 'Not Implemented', data: [[null]] };
}

export async function supportedChainsQuery() {
    const query = `SELECT DISTINCT chain FROM ${config.name}`;

    // Required format for returning a const value in order to make z.enum() work in the schema definitions
    const json = await makeQuery(query, 'JSONColumns');

    return json.chain
}
