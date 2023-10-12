import config from './config';

async function makeQuery(query: string) {
    const response = await fetch(`${config.DB_HOST}/?default_format=JSONCompact`, {
        method: "POST",
        body: query,
        headers: { "Content-Type": "text/plain" },
    });

    return await response.json();
}

export async function timestampQuery(blockchain: string, blocknum: number) {
    const query = `SELECT timestamp FROM ${config.DB_NAME} WHERE (blockchain == '${blockchain}') AND (blocknum == ${blocknum})`;

    return await makeQuery(query);
}

export async function blocknumQuery(blockchain: string, timestamp: Date) {
    const query = `SELECT blocknum FROM ${config.DB_NAME} WHERE (blockchain == '${blockchain}') AND (timestamp == '\
${timestamp.toISOString().replace('T', ' ').substring(0, 19)}')`;

    return await makeQuery(query);
}

export async function currentBlocknumQuery(blockchain: string) {
    const query = `SELECT MAX(blocknum) FROM ${config.DB_NAME} GROUP BY blockchain HAVING (blockchain == '${blockchain}')`;

    return await makeQuery(query);
}

export async function finalBlocknumQuery(blockchain: string) {
    /*const query = `SELECT MAX(blocknum) FROM ${config.DB_NAME} GROUP BY blockchain HAVING (blockchain == '${blockchain}')`;

    return await makeQuery(query);*/
    return { todo: 'Not Implemented', data: [[null]] };
}

export function supportedChains() {
    return ['EOS', 'ETH', 'UX', 'WAX'];
}