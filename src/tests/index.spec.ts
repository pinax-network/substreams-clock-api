import { describe, expect, it, beforeAll } from 'bun:test';

import app from '../index';
import config from '../config';
import { banner } from "../banner";
import { supportedChains, timestampQuery } from "../queries";

const dbIsUp = (await fetch(`${config.DB_HOST}/ping`).catch((error) => {}))?.status == 200;
console.info(`Database is ${dbIsUp ? '' : 'not '}running !`);

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

        expect(json).toHaveProperty('supportedChains');
        expect(json.supportedChains).toEqual(supportedChains());
    });
});

describe('Health page (/health)', () => {
    it.skipIf(dbIsUp)('Should fail on database connection error', async () => {
        const res = await app.request('/health');
        expect(res.status).toBe(503);

        const json = await res.json();
        expect(json).toHaveProperty('db_status');
        expect(json.db_status).toContain('ConnectionRefused');
    });

    it.if(dbIsUp)('Should return 200 Response', async () => {
        const res = await app.request('/health');
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json).toHaveProperty('db_status');
        expect(json.db_status).toContain('Ok');
    });
});

describe('Timestamp query page (/{chain}/timestamp?block_number=<block number>)', () => {
    let valid_chain;

    beforeAll(() => {
        valid_chain = supportedChains()[0];
    });

    it('Should fail on non-valid chains', async () => {
        const res = await app.request('/dummy/timestamp');
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.message).toContain('not supported');
    });

    it('Should fail on missing block number parameter', async () => {
        const res = await app.request(`/${valid_chain}/timestamp`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.message).toContain('missing');
    });

    it.each(['dummy', '-1', '0'])('Should fail on invalid block number: block_number=%s', async (blocknum: string) => {
        const res = await app.request(`/${valid_chain}/timestamp?block_number=${blocknum}`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.message).toContain('not a valid');
    });

    it.skipIf(dbIsUp)('Should fail on database connection error', async () => {
        const res = await app.request(`/${valid_chain}/timestamp?block_number=1`);
        expect(res.status).toBe(500);

        const json = await res.json();
        expect(json.message).toContain('ConnectionRefused');
    });

    it.if(dbIsUp)('Should return 200 Response on valid input', async () => {
        const blocknum = 1;
        const res = await app.request(`/${valid_chain}/timestamp?block_number=${blocknum}`);
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json).toHaveProperty('data');
    });
});

describe('Blocknum query page (/{chain}/blocknum?timestamp=<timestamp>)', () => {
    let valid_chain;

    beforeAll(() => {
        valid_chain = supportedChains()[0];
    });

    it('Should fail on non-valid chains', async () => {
        const res = await app.request('/dummy/blocknum');
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.message).toContain('not supported');
    });

    it('Should fail on missing timestamp parameter', async () => {
        const res = await app.request(`/${valid_chain}/blocknum`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.message).toContain('missing');
    });

    it.each(['dummy'])('Should fail on invalid timestamp: timestamp=%s', async (timestamp: string) => {
        const res = await app.request(`/${valid_chain}/blocknum?timestamp=${timestamp}`);
        expect(res.status).toBe(500);

        const json = await res.json();
        expect(json.message).toContain('Invalid');
    });

    it.skipIf(dbIsUp)('Should fail on database connection error', async () => {
        const res = await app.request(`/${valid_chain}/blocknum?timestamp=1`);
        expect(res.status).toBe(500);

        const json = await res.json();
        expect(json.message).toContain('ConnectionRefused');
    });

    it.if(dbIsUp)('Should return 200 Response on valid input', async () => {
        const timestamp = Date.parse(new Date());
        const res = await app.request(`/${valid_chain}/blocknum?timestamp=${timestamp}`);
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json).toHaveProperty('data');
    });
});

describe.each(['current'/*, 'final'*/])('Single blocknum query page (/{chain}/%s)', (query_type: string) => {
    it('Should fail on non-valid chains', async () => {
        const res = await app.request(`/dummy/${query_type}`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.message).toContain('not supported');
    });

    if (dbIsUp) { // Need to use explicit `if` as `it.if().each()('xxx')` is not defined
        it.each(supportedChains())('Should return a single value for each chain: %s', async (chain: string) => {
            const res = await app.request(`/${chain}/${query_type}`);
            expect(res.status).toBe(200);

            const json = await res.json();
            expect(json).toHaveProperty('data');
            expect(json.data).toHaveLength(1);

            console.log(chain, ':', json.data[0]);
        });
    } else {
        it.each(supportedChains())('Should fail on database connection error for each chain: %s', async (chain: string) => {
            const res = await app.request(`/${chain}/${query_type}`);
            expect(res.status).toBe(500);

            const json = await res.json();
            expect(json.message).toContain('ConnectionRefused');
        });
    }
});
