import { z } from '@hono/zod-openapi';

import config from './config';
import { supportedChainsQuery } from './queries';

const supportedChains = await supportedChainsQuery();

// Base types
const z_blocknum = z.coerce.number().positive();
const z_timestamp = z.coerce.date();

// Adapted from https://stackoverflow.com/a/75212079
// Enforces parsing capability from an array of blocknum strings returned by Clickhouse DB
const blocknumsFromStringArray = <T extends z.ZodType<Array<z.infer<typeof z_blocknum>>>>(schema: T) => {
    return z.preprocess((obj) => {
        if (Array.isArray(obj)) {
            return obj;
        } else if (typeof obj === "string") {
            return obj.split(",").map((v: string) => {
                const parsed = z_blocknum.safeParse(v);
                return parsed.success ? parsed.data : z.NEVER;
            });
        }
    }, schema);
};

// Same as above for timestamp parsing
const timestampsFromStringArray = <T extends z.ZodType<Array<z.infer<typeof z_timestamp>>>>(schema: T) => {
    return z.preprocess((obj) => {
        if (Array.isArray(obj)) {
            return obj;
        } else if (typeof obj === "string") {
            return obj.split(",").map((v: string) => {
                const epochParseResult = z.coerce.number().positive().safeParse(v);
                const parsed = epochParseResult.success ? z_timestamp.safeParse(new Date(epochParseResult.data)) : z_timestamp.safeParse(v);

                return parsed.success ? parsed.data : z.NEVER;
            });
        }
    }, schema);
};

// Represents the valid blockchain root path
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

// Represents the timestamp query parameter for `/{c}/timestamp?blocknum=` endpoint
// Supports array parsing via comma-separated values
export const BlocknumSchema = z.object({
    block_number: z.union([
        z_blocknum,
        blocknumsFromStringArray(z_blocknum.array().nonempty().max(config.maxElementsQueried))
    ])
    .openapi({
        param: {
            name: 'block_number',
            in: 'query',
        },
        example: 1337
    })
});

// Represents the timestamp query parameter for `/{c}/blocknum?timestamp=` endpoint
// Supports array parsing via comma-separated values
export const TimestampSchema = z.object({
    timestamp: z.union([
        z_timestamp,
        timestampsFromStringArray(z_timestamp.array().nonempty().max(config.maxElementsQueried))
    ])
    .openapi({
        param: {
            name: 'timestamp',
            in: 'query',
        },
        example: new Date().toISOString()
    })
});

// Represents a block number <> timestamp conversion output for `/{c}/timestamp` and `/{c}/blocknum` endpoints
// It can either be a single output for each field or an array of outputs
export const BlocktimeQueryResponseSchema = z.object({
    chain: z.enum(supportedChains).openapi({ example: 'EOS' }),
    block_number: z_blocknum.openapi({ example: 1337 }),
    timestamp: z.union([
        z_timestamp.openapi({ example: new Date().toISOString() }),
        z_timestamp.array().openapi({ example: [new Date(), new Date(0)] }),
    ])
}).openapi('BlocktimeQueryResponse');

export const BlocktimeQueryResponsesSchema = BlocktimeQueryResponseSchema.array().openapi('BlocktimeQueryResponses');

// Represents a single block number output for `/current` and `/final` endpoints
export const SingleBlocknumQueryResponseSchema = z.object({
    chain: z.enum(supportedChains).openapi({ example: 'EOS' }),
    block_number: z_blocknum.optional().openapi({ example: 1337 }),
}).openapi('SingleBlocknumQuery');

// Represents the supported chains output for `/chains`
export const SupportedChainsQueryResponseSchema = z.object({
    supportedChains: z.enum(supportedChains).array().openapi({ example: supportedChains })
}).openapi('SupportedChainsQuery');

// Type exports for ease of use
export type BlockchainSchema = z.infer<typeof BlockchainSchema>;
export type BlocknumSchema = z.infer<typeof BlocknumSchema>;
export type TimestampSchema = z.infer<typeof TimestampSchema>;

export type BlocktimeQueryResponseSchema = z.infer<typeof BlocktimeQueryResponseSchema>;
export type BlocktimeQueryResponsesSchema = z.infer<typeof BlocktimeQueryResponsesSchema>;
export type SingleBlocknumQueryResponseSchema = z.infer<typeof SingleBlocknumQueryResponseSchema>;
export type SupportedChainsQueryResponseSchema = z.infer<typeof SupportedChainsQueryResponseSchema>;
