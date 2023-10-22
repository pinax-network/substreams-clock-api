import { config } from './config';
import { makeQuery } from './clickhouse/makeQuery';

export interface Block {
    block_number: number;
    block_id: string;
    timestamp: string;
    chain: string;
}
export function parseLimit(limit?: string|null|number) {
    let value = 1; // default 1
    if (limit) {
        if (typeof limit === "string") value = parseInt(limit);
        if (typeof limit === "number") value = limit;
    }
    // limit to maxElementsQueried
    if ( value > config.maxElementsQueried ) value = config.maxElementsQueried;
    return value;
}

export function getBlock(options: {block_id?: string|null, block_number?: string|null, timestamp?: string|null, chain?: string|null, limit?: string|null}) {
    const limit = parseLimit(options.limit);
    let query = `SELECT * FROM ${config.table}`;
    const where = [];
    if ( options.chain ) where.push(`chain == '${options.chain}'`);
    if ( options.block_id ) where.push(`block_id == '${options.block_id}'`);
    if ( options.block_number ) where.push(`block_number == '${options.block_number}'`);
    if ( where.length ) query += ` WHERE (${where.join(' AND ')})`;
    query += ' ORDER BY block_number DESC'
    query += ` LIMIT ${limit}`
    return query;
}

export async function supportedChainsQuery() {
    const response = await makeQuery<{chain: string}>(`SELECT DISTINCT chain FROM ${config.table}`);
    return response.data.map((r) => r.chain);
}