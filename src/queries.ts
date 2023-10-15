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

async function makeQuery(query: string, format: string = 'JSONObjectEachRow') {
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

export async function timestampQuery(blockchain: string, blocknum: number | number[]) { // TODO: Merge `timestampQuery` / `blocknumQuery`
    const query = `SELECT (blockchain, blocknum, timestamp) FROM ${config.name} WHERE (blockchain == '${blockchain}') AND (blocknum IN (${blocknum.toString()}))`;
    const json = await makeQuery(query);

    return BlocktimeQueryResponsesSchema.parse(
        Object.values(json as JSONObjectEachRow).map((r: {
            [key: string]: Array<string>
        }) => {
        return BlocktimeQueryResponseSchema.parse({
            blockchain: Object.values(r)[0][0],
            block_number: Object.values(r)[0][1],
            timestamp: Object.values(r)[0][2]
        });
    }));
}

export async function blocknumQuery(blockchain: string, timestamp: Date | Date[]) {
    timestamp = Array.isArray(timestamp) ? timestamp : [timestamp];
    const query = `SELECT (blockchain, blocknum, timestamp) FROM ${config.name} WHERE (blockchain == '${blockchain}') AND (timestamp IN (${

        timestamp.map((t) => '\'' + t.toISOString().replace('T', ' ').substring(0, 19) + '\'').toString()
    }))`; // TODO: Find closest instead of matching timestamp or another route ?
    const json = await makeQuery(query);

    return BlocktimeQueryResponsesSchema.parse(
        Object.values(json as JSONObjectEachRow).map((r: {
            [key: string]: Array<string>
        }) => {
        return BlocktimeQueryResponseSchema.parse({
            blockchain: Object.values(r)[0][0],
            block_number: Object.values(r)[0][1],
            timestamp: Object.values(r)[0][2]
        });
    }));
}

export async function currentBlocknumQuery(blockchain: string) {
    const query = `SELECT MAX(blocknum) AS current FROM ${config.name} GROUP BY blockchain HAVING (blockchain == '${blockchain}')`;
    const json = await makeQuery(query);

    return SingleBlocknumQueryResponseSchema.parse({
        chain: blockchain,
        block_number: Object.values(json as JSONObjectEachRow)[0].current,
    });
}

export async function finalBlocknumQuery(blockchain: string) {
    /*const query = `SELECT MAX(blocknum) as final FROM ${config.name} GROUP BY blockchain HAVING (blockchain == '${blockchain}')`;
    const json = await makeQuery(query);

    return SingleBlocknumQueryResponseSchema.parse({
        chain: blockchain,
        block_number: Object.values(json as JSONObjectEachRow)[0].final,
    });
    */
    return { todo: 'Not Implemented', data: [[null]] };
}

export async function supportedChainsQuery() {
    const query = `SELECT DISTINCT blockchain FROM ${config.name}`;
    // Required for returning a const value in order to make z.enum() work in the schema definitions
    const json = await makeQuery(query, 'JSONColumns');

    return json.blockchain
}
