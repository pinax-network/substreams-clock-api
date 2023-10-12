import config from './config';

export async function timestampQuery(blockchain: string, blocknum: number) {
    const query = `SELECT timestamp FROM ${config.DB_NAME} WHERE (blockchain == '${blockchain}') AND (blocknum == ${blocknum})`;

    const response = await fetch(`${config.DB_HOST}/?default_format=JSONCompact`, {
        method: "POST",
        body: query,
        headers: { "Content-Type": "text/plain" },
    });

    const json = await response.json();

    return json;
}

export async function blocknumQuery(blockchain: string, timestamp: Date) {
    const query = `SELECT blocknum FROM ${config.DB_NAME} WHERE (blockchain == '${blockchain}') AND (timestamp == '\
${timestamp.toISOString().replace('T', ' ').substring(0, 19)}')`;

    const response = await fetch(`${config.DB_HOST}/?default_format=JSONCompact`, {
        method: "POST",
        body: query,
        headers: { "Content-Type": "text/plain" },
    });

    const json = await response.json();

    return json;
}

export function supportedChains() {
    return ['EOS', 'ETH', 'UX', 'WAX'];
}