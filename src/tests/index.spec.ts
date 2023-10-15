import { describe, expect, it, beforeAll } from 'bun:test';
import { ZodError } from 'zod';

import config from '../config';
import { generateApp }  from '../index';
import { banner } from "../banner";
import { supportedChainsQuery, timestampQuery } from "../queries";
import {
    BlocktimeQueryResponseSchema, SingleBlocknumQueryResponseSchema, SupportedChainsQueryResponseSchema
} from '../schemas';

const app = generateApp();
const supportedChains = await supportedChainsQuery();

describe('Index page (/)', () => {
    it('Should return 200 Response', async () => {
        const res = await app.request('/');
        expect(res.status).toBe(200);
    });

    it('Should have the banner as the body', async () => {
        const res = await app.request('/');
        expect(await res.text()).toBe(banner());
    });
});

describe('Chains page (/chains)', () => {
    it('Should return 200 Response', async () => {
        const res = await app.request('/chains');
        expect(res.status).toBe(200);
    });

    it('Should return the supported chains as JSON', async () => {
        const res = await app.request('/chains');
        const json = await res.json();

        expect(SupportedChainsQueryResponseSchema.safeParse(json).success).toBe(true);
    });
});

describe('Health page (/health)', () => {
    it('Should return 200 Response', async () => {
        const res = await app.request('/health');
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json).toHaveProperty('db_status');
        expect(json.db_status).toContain('Ok');
    });
});

describe('Timestamp query page (/{chain}/timestamp?block_number=<block number>)', () => {
    let valid_chain: string;
    let valid_blocknum: number;

    beforeAll(() => {
        valid_chain = supportedChains[0];
        valid_blocknum = 1337;
    });

    it('Should fail on non-valid chains', async () => {
        const res = await app.request(`/dummy/timestamp?block_number=${valid_blocknum}`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.issues[0].code).toBe('invalid_enum_value');
    });

    it.each(['', 'abc', '1,#'])('Should fail on missing or invalid block number parameter: block_number=%s', async (blocknum: string) => {
        const res = await app.request(`/${valid_chain}/timestamp?block_number=${blocknum}`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(['invalid_union', 'too_small']).toContain(json.error.issues[0].code);
    });

    it.each([-1, 0])('Should fail on non-positive block number: block_number=%s', async (blocknum: number) => {
        const res = await app.request(`/${valid_chain}/timestamp?block_number=${blocknum}`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.issues[0].code).toBe('too_small');
    });

    it(`Should not allow more than the maximum number of elements to be queried (${config.maxElementsQueried})`, async () => {
        const res = await app.request(`/${valid_chain}/timestamp?block_number=${Array(config.maxElementsQueried + 1).fill(valid_blocknum).toString()}`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.issues[0].code).toBe('too_big');
    });

    it('Should return (200) empty JSON on valid input', async () => {
        const res = await app.request(`/${valid_chain}/timestamp?block_number=${valid_blocknum}`);
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json).toHaveLength(0);
    });
});

describe('Blocknum query page (/{chain}/blocknum?timestamp=<timestamp>)', () => {
    let valid_chain: string;
    let valid_timestamp: Date;

    beforeAll(() => {
        valid_chain = supportedChains[0];
        valid_timestamp = new Date();
    });

    it('Should fail on non-valid chains', async () => {
        const res = await app.request(`/dummy/blocknum?timestamp=${valid_timestamp}`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.issues[0].code).toBe('invalid_enum_value');
    });

    it.each(['', 'abc'])('Should fail on missing or invalid timestamp parameter: timestamp=%s', async (timestamp: string) => {
        const res = await app.request(`/${valid_chain}/blocknum?timestamp=${timestamp}`);
        expect(res.status).toBe(400);

        const json = await res.json() as ZodError;
        expect(json.success).toBe(false);
        expect(json.error.issues[0].code).toBe('invalid_union');
        expect(json.error.issues[0].unionErrors[0].issues[0].code).toBe('invalid_date');
    });

    it(`Should not allow more than the maximum number of elements to be queried (${config.maxElementsQueried})`, async () => {
        const res = await app.request(`/${valid_chain}/blocknum?timestamp=${Array(config.maxElementsQueried + 1).fill(valid_timestamp).toString()}`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.issues[0].code).toBe('too_big');
    });

    it('Should return (200) empty JSON on valid input', async () => {
        const res = await app.request(`/${valid_chain}/blocknum?timestamp=${valid_timestamp}`);
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json).toHaveLength(0);
    });
});

describe.each(['current'/*, 'final'*/])('Single blocknum query page (/{chain}/%s)', (query_type: string) => {
    it('Should fail on non-valid chains', async () => {
        const res = await app.request(`/dummy/${query_type}`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.issues[0].code).toBe('invalid_enum_value');
    });

    it.each(supportedChains)('Should return a single value for each chain: %s', async (chain: string) => {
        const res = await app.request(`/${chain}/${query_type}`);
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(SingleBlocknumQueryResponseSchema.safeParse(json).success).toBe(true);
    });
});
