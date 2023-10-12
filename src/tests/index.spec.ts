import { describe, expect, it, beforeAll } from 'bun:test';

import app from '../index';
import { banner } from "../banner";
import { supportedChains, timestampQuery } from "../queries";

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

describe('Timestamp query page (/{chain}/timestamp?n=<block number>)', () => {
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

    it.each(['dummy', '-1', '0'])('Should fail on invalid block number: n=%s', async (blocknum) => {
        const res = await app.request(`/${valid_chain}/timestamp?n=${blocknum}`);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.message).toContain('not a valid');
    });

    it('Should fail on database connection error', async () => {
        const res = await app.request(`/${valid_chain}/timestamp?n=1`);
        expect(res.status).toBe(500);

        const json = await res.json();
        expect(json.message).toContain('ConnectionRefused');
    });
});

describe('Blocknum query page (/{chain}/blocknum?t=<timestamp>)', () => {
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

    it.each(['dummy'])('Should fail on invalid timestamp: t=%s', async (timestamp) => {
        const res = await app.request(`/${valid_chain}/blocknum?t=${timestamp}`);
        expect(res.status).toBe(500);

        const json = await res.json();
        expect(json.message).toContain('Invalid');
    });

    it('Should fail on database connection error', async () => {
        const res = await app.request(`/${valid_chain}/blocknum?t=1`);
        expect(res.status).toBe(500);

        const json = await res.json();
        expect(json.message).toContain('ConnectionRefused');
    });
});