import { createRoute } from '@hono/zod-openapi';
import * as schemas from './schemas';

export const indexRoute = createRoute({
    method: 'get',
    path: '/',
    responses: {
        200: {
            description: 'Index page banner.',
        },
    },
});

export const healthCheckRoute = createRoute({
    method: 'get',
    path: '/health',
    responses: {
        200: { description: 'OK' },
    },
});

export const metricsRoute = createRoute({
    method: 'get',
    path: '/metrics',
    responses: {
        200: {
            description: 'Prometheus metrics.',
        },
    },
});

export const supportedChainsRoute = createRoute({
    method: 'get',
    path: '/chains',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: schemas.SupportedChainsQueryResponseSchema,
                },
            },
            description: 'Fetch supported chains from the Clickhouse DB.',
        },
    },
});

// Note: OpenAPI (`/openapi`) and SwaggerUI (`/swagger`) routes are created directly in `index.ts`

export const blocknumQueryRoute = createRoute({
    method: 'get',
    path: '/{chain}/blocknum',
    request: {
        params: schemas.BlockchainSchema,
        query: schemas.TimestampSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: schemas.BlocktimeQueryResponsesSchema,
                    examples: {
                        single: { summary: 'Single', value: [{ chain: 'mainnet', block_number: 18394302, timestamp: '2023-10-20T21:45:11' }] },
                        multiple: { summary: 'Multiple', value: [
                            { chain: 'mainnet', block_number: 18394302, timestamp: '2023-10-20T21:45:11' },
                            { chain: 'mainnet', block_number: 18395243, timestamp: '2023-10-21T23:22:53' }
                        ]},
                    }
                },
            },
            description: 'Retrieve the block number associated with the given timestamp on the blockchain.',
        },
    },
});

export const timestampQueryRoute = createRoute({
    method: 'get',
    path: '/{chain}/timestamp',
    request: {
        params: schemas.BlockchainSchema,
        query: schemas.BlocknumSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: schemas.BlocktimeQueryResponsesSchema,
                    examples: {
                        single: { summary: 'Single', value: [{'chain': 'mainnet', 'block_number': 18394302, 'timestamp': '2023-10-20T21:45:11'}] },
                        multiple: { summary: 'Multiple', value: [
                            { chain: 'mainnet', block_number: 18394302, timestamp: '2023-10-20T21:45:11' },
                            { chain: 'mainnet', block_number: 18395243, timestamp: '2023-10-21T23:22:53' }
                        ]},
                    }
                },
            },
            description: 'Retrieve the timestamp associated with the given block number on the blockchain.',
        },
    },
});

export const currentBlocknumQueryRoute = createRoute({
    method: 'get',
    path: '/{chain}/current',
    request: {
        params: schemas.BlockchainSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: schemas.SingleBlocknumQueryResponseSchema,
                },
            },
            description: 'Retrieve the latest block number on the blockchain.',
        },
    },
});

export const finalBlocknumQueryRoute = createRoute({
    method: 'get',
    path: '/{chain}/final',
    request: {
        params: schemas.BlockchainSchema,
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: schemas.SingleBlocknumQueryResponseSchema,
                    examples: {
                        valid: { summary: 'Valid', value: { chain: 'mainnet', block_number: 18394302 } },
                        missing: { summary: 'Missing', value: { chain: 'mainnet' } }
                    }
                },
            },
            description: 'Retrieve the latest final block number on the blockchain. If no final block is found, no block number will be returned.',
        },
    },
});