import { z } from '@hono/zod-openapi';

import { config } from './config';
import { supportedChainsQuery } from './queries';

// Removes milliseconds and 'Z' from ISO string to match Clickhouse DB insert
function toTimestampDBFormat(d: Date) {
    return d.toISOString().split('.')[0];
}

const supportedChains = await supportedChainsQuery();

// Base types
const z_blocknum = z.coerce.number().positive();
const z_timestamp = z.coerce.date().transform((t: Date) => {
    const toUTC = new Date(
        Date.UTC(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds())
    );

    return toTimestampDBFormat(toUTC);
});

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
const timestampsFromStringArray = <T extends z.ZodTypeAny>(schema: T) => {
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

export const BlockchainSchema = z.object({
    chain: z.enum(supportedChains)
    .openapi({
        param: {
            name: 'chain',
            in: 'path',
        },
        examples: supportedChains,
    })
})
.describe('Represents the valid blockchain(s) root path based on the data available in Clickhouse DB.')
.openapi('BlockchainSchema');

export const BlocknumSchema = z.object({
    block_number: z.union([
        z_blocknum,
        blocknumsFromStringArray(z_blocknum.array().nonempty().max(config.maxElementsQueried))
    ])
    .openapi({
        param: {
            name: 'block_number',
            in: 'query',
            examples : {
                single: { summary: 'Single', value: 1337 },
                multiple: { summary: 'Multiple', description: `Up to ${config.maxElementsQueried} elements maximum`, value: [1337, 9999, 1231].toString() },
            }
        },
    })
})
.describe('Represents the timestamp query parameter for `/{chain}/timestamp?blocknum=` endpoint. Supports array parsing via comma-separated values.')
.openapi('BlocknumSchema');

const unix_timestamp_example = Date.now().toString();
export const TimestampSchema = z.object({
    timestamp: z.union([
        z_timestamp,
        timestampsFromStringArray(z_timestamp.array().nonempty().max(config.maxElementsQueried))
    ])
    .openapi({
        param: {
            name: 'timestamp',
            in: 'query',
            examples: {
                unix: { summary: 'UNIX', value: unix_timestamp_example },
                iso: {
                    summary: 'ISO',
                    description: 'Be wary of timezone information, the API expects timestamp to be in UTC',
                    value: '2023-10-17T23:59:47Z'
                },
                full: { summary: 'Datetime', value: '2023-10-18 01:10:22' },
                multiple: {
                    summary: 'Multiple',
                    description: `Up to ${config.maxElementsQueried} elements maximum`,
                    value: ['2023-10-18 01:10:22', unix_timestamp_example]
                },
            }
        },
    })
})
.describe('Represents the timestamp query parameter for `/{chain}/blocknum?timestamp=` endpoint. Supports array parsing via comma-separated values.')
.openapi('TimestampSchema');

export const BlocktimeQueryResponseSchema = z.intersection(
    z.intersection(
        BlockchainSchema,
        BlocknumSchema
    ), TimestampSchema
)
.describe('Represents a block number <> timestamp conversion output for `/{chain}/timestamp` and `/{chain}/blocknum` endpoints.')
.openapi('BlocktimeQueryResponse');

export const BlocktimeQueryResponsesSchema = BlocktimeQueryResponseSchema.array()
.describe('A convenience schema for zero or more block number / timestamps output when using an array as query parameter.')
.openapi('BlocktimeQueryResponses');

export const SingleBlocknumQueryResponseSchema = z.intersection(
    BlockchainSchema,
    BlocknumSchema,
)
.describe('Represents a single block number output for `/current` and `/final` endpoints.')
.openapi('SingleBlocknumQueryResponse');

export const SupportedChainsQueryResponseSchema = z.object({
    supportedChains: z.enum(supportedChains).array()
})
.describe('Represents the supported chains output for `/chains`.')
.openapi('SupportedChainsQueryResponse');

// Type exports for ease of use
export type BlockchainSchema = z.infer<typeof BlockchainSchema>;
export type BlocknumSchema = z.infer<typeof BlocknumSchema>;
export type TimestampSchema = z.infer<typeof TimestampSchema>;

export type BlocktimeQueryResponseSchema = z.infer<typeof BlocktimeQueryResponseSchema>;
export type BlocktimeQueryResponsesSchema = z.infer<typeof BlocktimeQueryResponsesSchema>;
export type SingleBlocknumQueryResponseSchema = z.infer<typeof SingleBlocknumQueryResponseSchema>;
export type SupportedChainsQueryResponseSchema = z.infer<typeof SupportedChainsQueryResponseSchema>;
