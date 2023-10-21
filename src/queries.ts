import { config } from './config';
import { makeQuery } from './clickhouse/makeQuery';
import { logger } from './logger';

export async function getBlock(options: {block_id?: string, block_number?: number, timestamp?: string, chain?: string, limit: number}) {
    let query = `SELECT block_number, block_id, timestamp, chain FROM ${config.table}`;
    const where = [];
    if ( options.chain ) where.push(`chain == '${options.chain}'`);
    if ( options.block_id ) where.push(`block_id == '${options.block_id}'`);
    if ( options.block_number ) where.push(`block_number == '${options.block_number}'`);
    if ( where.length ) query += ` WHERE (${where.join(' AND ')})`;
    query += ' ORDER BY block_number DESC'
    query += ` LIMIT ${options.limit}`
    logger.info('getBlock', options)
    return makeQuery<{chain: string}>(query);
}

export async function supportedChainsQuery() {
    const response = await makeQuery<{chain: string}>(`SELECT DISTINCT chain FROM ${config.table}`);
    return response.data.map((r) => r.chain);
}