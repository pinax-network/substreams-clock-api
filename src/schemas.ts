import { z } from '@hono/zod-openapi';

import config from './config';
import { supportedChainsQuery } from './queries';

const supportedChains = await supportedChainsQuery();
const z_blocknum = z.coerce.number().positive();
const z_timestamp = z.coerce.date();

// Adapted from https://stackoverflow.com/a/75212079
const convertBlocknumArray = <T extends z.ZodType<Array<number>>>(schema: T) => {
    return z.preprocess((obj) => {
        if (Array.isArray(obj)) {
            return obj;
        } else if (typeof obj === "string") {
            return obj.split(",").map((v: string) => {
                const parsed = z_blocknum.safeParse(v);
                if (parsed.success)
                    return parsed.data;
                else
                    return z.NEVER;
            });
        }
    }, schema);
};
const convertTimestampArray = <T extends z.ZodType<Array<Date>>>(schema: T) => {
    return z.preprocess((obj) => {
        if (Array.isArray(obj)) {
            return obj;
        } else if (typeof obj === "string") {
            return obj.split(",").map((v: string) => {
                const epochParseResult = z.coerce.number().positive().safeParse(v);
                let parsed;

                if (epochParseResult.success) // Convert epoch
                    parsed = z_timestamp.safeParse(new Date(epochParseResult.data));
                else // Convert string directly
                    parsed = z_timestamp.safeParse(v);

                if (parsed.success)
                    return parsed.data;
                else
                    return z.NEVER;
            });
        }
    }, schema);
};

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
    block_number: z.union([
        z_blocknum,
        convertBlocknumArray(z_blocknum.array().nonempty().max(config.maxElementsQueried))
    ])
    .openapi({
        param: {
            name: 'block_number',
            in: 'query',
        },
        example: 1337
    })
});
export type BlocknumSchema = z.infer<typeof BlocknumSchema>;

export const TimestampSchema = z.object({
    timestamp: z.union([
        z_timestamp,
        convertTimestampArray(z_timestamp.array().nonempty().max(config.maxElementsQueried))
    ])
    .openapi({
        param: {
            name: 'timestamp',
            in: 'query',
        },
        example: new Date().toISOString()
    })
});
export type TimestampSchema = z.infer<typeof TimestampSchema>;

export const BlocktimeQueryResponseSchema = z.object({
    blockchain: z.enum(supportedChains).openapi({ example: 'EOS' }),
    block_number: z_blocknum.openapi({ example: 1337 }),
    timestamp: z.union([
        z_timestamp.openapi({ example: new Date().toISOString() }),
        z_timestamp.array().openapi({ example: [new Date(), new Date(0)] }),
    ])
}).openapi('BlocktimeQueryResponse');
export type BlocktimeQueryResponseSchema = z.infer<typeof BlocktimeQueryResponseSchema>;

export const BlocktimeQueryResponsesSchema = BlocktimeQueryResponseSchema.array().openapi('BlocktimeQueryResponses');
export type BlocktimeQueryResponsesSchema = z.infer<typeof BlocktimeQueryResponsesSchema>;

export const SingleBlocknumQueryResponseSchema = z.object({
    chain: z.enum(supportedChains).openapi({ example: 'EOS' }),
    block_number: z_blocknum.optional().openapi({ example: 1337 }),
}).openapi('SingleBlocknumQuery');
export type SingleBlocknumQueryResponseSchema = z.infer<typeof SingleBlocknumQueryResponseSchema>;

export const SupportedChainsQueryResponseSchema = z.object({
    supportedChains: z.enum(supportedChains).array().openapi({ example: supportedChains })
}).openapi('SupportedChainsQuery');
export type SupportedChainsQueryResponseSchema = z.infer<typeof SupportedChainsQueryResponseSchema>;