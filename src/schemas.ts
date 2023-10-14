import { z } from '@hono/zod-openapi';

import { supportedChainsQuery } from './queries';

const supportedChains = await supportedChainsQuery();
const z_blocknum = z.coerce.number().positive();
const z_timestamp = z.coerce.date();

export const BlockchainSchema = z.object({
    chain: z.enum(supportedChains)
    .openapi({
        param: {
            name: 'chain',
            in: 'path',
        },
        example: 'EOS',
    })
});

export const BlocknumSchema = z.object({
    block_number: z_blocknum.openapi({
        param: {
            name: 'block_number',
            in: 'query',
        },
        example: 1337
    })
});

export const TimestampSchema = z.object({
    timestamp: z_timestamp.openapi({
        param: {
            name: 'timestamp',
            in: 'query',
        },
        example: new Date()
    })
});
// TODO: Add support for array of response (to mirror array of params)
export const BlocktimeQueryResponseSchema = z.object({
    chain: z.enum(supportedChains).openapi({ example: 'EOS' }),
    block_number: z_blocknum.optional().openapi({ example: 1337 }),
    timestamp: z_timestamp.optional().openapi({ example: new Date() }),
}).openapi('BlocktimeQuery');

export const SingleBlocknumQueryResponseSchema = z.object({
    chain: z.enum(supportedChains).openapi({ example: 'EOS' }),
    block_number: z_blocknum.optional().openapi({ example: 1337 }),
}).openapi('SingleBlocknumQuery');

export const SupportedChainsQueryResponseSchema = z.object({
    supportedChains: z.enum(supportedChains).array().openapi({ example: supportedChains })
}).openapi('SupportedChainsQuery');