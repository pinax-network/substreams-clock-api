import { config } from './config';
import { parseLimit, parseTimestamp } from './utils';

export interface Block {
    block_number: number;
    block_id: string;
    timestamp: string;
    chain: string;
}

export function getBlock(searchParams: URLSearchParams) {
    // URL Params
    const chain = searchParams.get("chain");
    const block_number = searchParams.get("block_number");
    const block_id = searchParams.get("block_id");
    const timestamp = parseTimestamp(searchParams.get("timestamp"));
    const limit = parseLimit(searchParams.get("limit"));
    // TO-DO: lessOrEquals, greaterOrEquals, less & greater block number & timestamp
    // TO-DO: Modulo block number (ex: search by every 1M blocks)

    // SQL Query
    let query = `SELECT * FROM ${config.table}`;
    const where = [];
    if ( chain ) where.push(`chain == '${chain}'`);
    if ( block_id ) where.push(`block_id == '${block_id}'`);
    if ( block_number ) where.push(`block_number == '${block_number}'`);
    if ( timestamp ) where.push(`timestamp == '${timestamp}'`);
    if ( where.length ) query += ` WHERE (${where.join(' AND ')})`;
    query += ' ORDER BY block_number DESC'
    query += ` LIMIT ${limit}`
    return query;
}

export function getChain() {
    return `SELECT DISTINCT chain FROM ${config.table}`;
}
