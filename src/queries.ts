import { store } from './clickhouse/stores.js';
import { config } from './config.js';
import { parseBlockId, parseBlockNumber, parseChain, parseLimit, parseSortBy, parseTimestamp, parseAggregateFunction, parseHistoryRange} from './utils.js';

export interface Block {
    block_number: number;
    block_id: string;
    timestamp: string;
    chain: string;
}

export interface UAWHistory {
    chain: string;
    UAW: string;
    day: number;
}

export function createBlockQuery (searchParams: URLSearchParams) {
    // SQL Query
    let query = `SELECT * FROM ${config.table}`;
    const where = [];

    // TO-DO: Modulo block number (ex: search by every 1M blocks)
    // Clickhouse Operators
    // https://clickhouse.com/docs/en/sql-reference/operators
    const operators = [
        ["greater_or_equals", ">="],
        ["greater", ">"],
        ["less_or_equals", "<="],
        ["less", "<"],
        ]
    for ( const [key, operator] of operators ) {
        const block_number = parseBlockNumber(searchParams.get(`${key}_by_block_number`));
        const timestamp = parseTimestamp(searchParams.get(`${key}_by_timestamp`));
        if (block_number) where.push(`block_number ${operator} ${block_number}`);
        if (timestamp) where.push(`toUnixTimestamp(timestamp) ${operator} ${timestamp}`);
    }

    // equals
    const chain = parseChain(searchParams.get("chain"));
    const block_id = parseBlockId(searchParams.get("block_id"));
    const block_number = parseBlockNumber(searchParams.get('block_number'));
    const timestamp = parseTimestamp(searchParams.get('timestamp'));
    if (chain) where.push(`chain == '${chain}'`);
    if (block_id) where.push(`block_id == '${block_id}'`);
    if (block_number) where.push(`block_number == '${block_number}'`);
    if (timestamp) where.push(`toUnixTimestamp(timestamp) == ${timestamp}`);

    // Join WHERE statements with AND
    if ( where.length ) query += ` WHERE (${where.join(' AND ')})`;

    // Sort and Limit
    const limit = parseLimit(searchParams.get("limit"));
    const sort_by = parseSortBy(searchParams.get("sort_by"));
    query += ` ORDER BY block_number ${sort_by}`
    query += ` LIMIT ${limit}`

    return query;
};

export async function getBlock(searchParams: URLSearchParams) {
    const chain = searchParams.get("chain");

    if (!chain) {
        const chains = await store.chains;
        if (!chains) {
            throw new Error("chains is null");
        }
        let queries = chains.map((chain) => {
            searchParams.set('chain', chain);
            return createBlockQuery(searchParams);
        });

        return queries.join(' UNION ALL ');
    } else {
        return createBlockQuery(searchParams);
    }
}

export function getAggregate(searchParams: URLSearchParams, aggregate_column: string) {
    // SQL Query
    let query = `SELECT chain,`;

    // Aggregate Function
    const aggregate_function = parseAggregateFunction(searchParams.get("aggregate_function"));

    // Aggregate Column
    if (aggregate_column == undefined) throw new Error("aggregate_column is undefined");
    else query += ` ${aggregate_function}(${aggregate_column})`

    query += ` FROM BlockStats`;

    const where = [];
    // Clickhouse Operators
    // https://clickhouse.com/docs/en/sql-reference/operators
    const operators = [
        ["greater_or_equals", ">="],
        ["greater", ">"],
        ["less_or_equals", "<="],
        ["less", "<"],
    ]
    for ( const [key, operator] of operators ) {
        const block_number = parseBlockNumber(searchParams.get(`${key}_by_block_number`));
        const timestamp = parseTimestamp(searchParams.get(`${key}_by_timestamp`));
        if (block_number) where.push(`block_number ${operator} ${block_number}`);
        if (timestamp) where.push(`toUnixTimestamp(timestamp) ${operator} ${timestamp}`);
    }

    // equals
    const block_number = parseBlockNumber(searchParams.get('block_number'));
    if (block_number) where.push(`block_number == '${block_number}'`);

    const timestamp = parseTimestamp(searchParams.get('timestamp'));
    if (timestamp) where.push(`toUnixTimestamp(timestamp) == ${timestamp}`);

    const chain = parseChain(searchParams.get('chain'));
    if (chain) where.push(`chain == '${chain}'`);

    // Join WHERE statements with AND
    if ( where.length ) query += ` WHERE (${where.join(' AND ')})`;

    // Group by chain
    query += ` GROUP BY chain`;
    
    return query;
}

export function getUAWFromDate(searchParams: URLSearchParams) {
    // SQL Query 
    let query = `SELECT chain, count(distinct uaw) FROM BlockStats ARRAY JOIN uaw`;
 
    const where = [];

    const date = parseTimestamp(searchParams.get('date'));
    if (date) where.push(`toUnixTimestamp(DATE(timestamp)) == toUnixTimestamp(DATE(${date}))`);
    
    const chain = parseChain(searchParams.get('chain'));
    if (chain) where.push(`chain == '${chain}'`);

    // Join WHERE statements with AND
    if ( where.length ) query += ` WHERE (${where.join(' AND ')})`;
 
    // Group by chain
    query += ` GROUP BY chain`;
     
    return query;
}

export function getUAWHistory(searchParams: URLSearchParams) {
    // SQL Query 
    let query = `SELECT chain, toUnixTimestamp(DATE(timestamp)) as day, count(distinct uaw) as UAW  FROM BlockStats ARRAY JOIN uaw`;
 
    const where = [];

    const datetime_of_query = Math.floor(Number(new Date()) / 1000);
    const date_of_query = Math.floor(Number(new Date().setHours(0,0,0,0)) / 1000);
    
    //const test = 1694296800;

    const range = parseHistoryRange(searchParams.get('range'));

    if (range?.includes('h')) {
        const hours = parseInt(range);
        if (hours) where.push(`timestamp BETWEEN ${datetime_of_query} - 3600 * ${hours} AND ${datetime_of_query}`);
    }

    if (range?.includes('d')) {
        const days = parseInt(range);
        if (days) where.push(`timestamp BETWEEN ${date_of_query} - 86400 * ${days} AND ${date_of_query}`);
    }

    if(range?.includes('y')) {
        const years = parseInt(range);
        if (years) where.push(`timestamp BETWEEN ${date_of_query} - 31536000 * ${years} AND ${date_of_query}`);
    }
    
    const chain = parseChain(searchParams.get('chain'));
    if (chain) where.push(`chain == '${chain}'`);

    // Join WHERE statements with AND
    if ( where.length ) query += ` WHERE (${where.join(' AND ')})`;

    query += ` GROUP BY chain, day ORDER BY day ASC`;
     
    return query;
}