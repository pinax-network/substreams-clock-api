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
export type BlockchainSchema = z.infer<typeof BlockchainSchema>;

export const BlocknumSchema = z.object({
    block_number: z_blocknum.openapi({
        param: {
            name: 'block_number',
            in: 'query',
        },
        example: 1337
    })
});
export type BlocknumSchema = z.infer<typeof BlocknumSchema>;

export const TimestampSchema = z.object({
    timestamp: z_timestamp.openapi({
        param: {
            name: 'timestamp',
            in: 'query',
        },
        example: new Date().toISOString()
    })
});
export type TimestampSchema = z.infer<typeof TimestampSchema>;

// TODO: Add support for array of response (to mirror array of params)
export const BlocktimeQueryResponseSchema = z.object({
    chain: z.enum(supportedChains).openapi({ example: 'EOS' }),
    block_number: z_blocknum.optional().openapi({ example: 1337 }),
    timestamp: z_timestamp.optional().openapi({ example: new Date().toISOString() }),
}).openapi('BlocktimeQuery');
export type BlocktimeQueryResponseSchema = z.infer<typeof BlocktimeQueryResponseSchema>;

export const SingleBlocknumQueryResponseSchema = z.object({
    chain: z.enum(supportedChains).openapi({ example: 'EOS' }),
    block_number: z_blocknum.optional().openapi({ example: 1337 }),
}).openapi('SingleBlocknumQuery');
export type SingleBlocknumQueryResponseSchema = z.infer<typeof SingleBlocknumQueryResponseSchema>;

export const SupportedChainsQueryResponseSchema = z.object({
    supportedChains: z.enum(supportedChains).array().openapi({ example: supportedChains })
}).openapi('SupportedChainsQuery');
export type SupportedChainsQueryResponseSchema = z.infer<typeof SupportedChainsQueryResponseSchema>;