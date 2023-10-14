import { z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';

import config from './config';
import { BlocktimeQueryResponseSchema, SingleBlocknumQueryResponseSchema} from './schemas';

async function makeQuery(query: string) {
    const response = await fetch(`${config.DB_HOST}/?default_format=JSONColumns`, {
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

export async function timestampQuery(blockchain: string, blocknum: number) {
    const query = `SELECT timestamp FROM ${config.DB_NAME} WHERE (blockchain == '${blockchain}') AND (blocknum == ${blocknum})`; // TODO: Replace with IN clause
    const json = await makeQuery(query);

    return {
        chain: blockchain,
        block_number: blocknum,
        timestamp: json.timestamp[0]
    } as z.infer<typeof BlocktimeQueryResponseSchema>;
}

export async function blocknumQuery(blockchain: string, timestamp: Date) {
    const query = `SELECT blocknum FROM ${config.DB_NAME} WHERE (blockchain == '${blockchain}') AND (timestamp == '\
${timestamp.toISOString().replace('T', ' ').substring(0, 19)}')`; // TODO: Find closest instead of matching timestamp or another route ?
    const json = await makeQuery(query);

    return {
        chain: blockchain,
        block_number: json.blocknum[0],
        timestamp
    } as z.infer<typeof BlocktimeQueryResponseSchema>;
}

export async function currentBlocknumQuery(blockchain: string) {
    const query = `SELECT MAX(blocknum) AS current FROM ${config.DB_NAME} GROUP BY blockchain HAVING (blockchain == '${blockchain}')`;
    const json = await makeQuery(query);

    return {
        chain: blockchain,
        block_number: json.current[0],
    } as z.infer<typeof SingleBlocknumQueryResponseSchema>;
}

export async function finalBlocknumQuery(blockchain: string) {
    /*const query = `SELECT MAX(blocknum) as final FROM ${config.DB_NAME} GROUP BY blockchain HAVING (blockchain == '${blockchain}')`;
    const json = await makeQuery(query);

    return {
        chain: blockchain,
        block_number: json.final[0],
    } as z.infer<typeof SingleBlocknumQueryResponseSchema>;
    */
    return { todo: 'Not Implemented', data: [[null]] };
}

export async function supportedChainsQuery() {
    const query = `SELECT DISTINCT blockchain FROM ${config.DB_NAME}`;
    const json = await makeQuery(query);

    return json.blockchain
}
