import { z } from '@hono/zod-openapi';

import { supportedChains } from './queries';

export const BlockchainSchema = z.object({
    chain: z.enum(supportedChains())
    .openapi({
        param: {
            name: 'chain',
            in: 'path',
        },
        example: 'EOS',
    })
});

export const BlocknumSchema = z.object({
    block_number: z.coerce.number().positive()
    .openapi({
        param: {
            name: 'block_number',
            in: 'query',
        },
        example: 1337
    })
});

export const TimestampSchema = z.object({
    timestamp: z.coerce.date()
    .openapi({
        param: {
            name: 'timestamp',
            in: 'query',
        },
        example: new Date()
    })
});

export const BlocktimeQueryResponseSchema = z.object({
    chain: z.enum(supportedChains()).openapi({
        example: 'EOS',
    }),
    block_number: z.number().positive().openapi({
        example: 1337,
    }),
    timestamp: z.date().openapi({
        example: new Date(),
    }),
}).openapi('BlocktimeQuery');

export const SingleBlocknumQueryResponseSchema = z.object({
    chain: z.enum(supportedChains()).openapi({
        example: 'EOS',
    }),
    block_number: z.number().positive().openapi({
        example: 1337,
    }),
}).openapi('SingleBlocknumQuery');