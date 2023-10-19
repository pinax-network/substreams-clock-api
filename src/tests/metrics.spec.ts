import { describe, expect, it, beforeAll } from 'bun:test';
import { AggregatorRegistry } from 'prom-client';

import * as metrics from '../prometheus';
import { generateApp }  from '../index';
import { supportedChainsQuery } from "../queries";

async function sumMetric(name: string) {
    return (await metrics.registry.getSingleMetric(name).get()).values.reduce((s, v) => s + v.value, 0);
}

const app = generateApp();
const valid_chain = (await supportedChainsQuery())[0];
const valid_blocknum = (await (await app.request(`/${valid_chain}/current`)).json()).block_number;

describe('API metrics', () => {
    it.each(['/', '/metrics', '/chains'])('Should log successful queries: %s', async (path: string) => {
        const previous = await sumMetric('successful_queries');
        const res = await app.request(path);
        const after = await sumMetric('successful_queries');

        expect(res.status).toBe(200);
        expect(after).toBe(previous + 1);
    });

    it.each([
        '/dummy',
        `/${valid_chain}/dummy`,
    ])('Should log not found queries: %s', async (path: string) => {
        const previous = await sumMetric('notfound_errors');
        const res = await app.request(path);
        const after = await sumMetric('notfound_errors');

        expect(res.status).toBe(404);
        expect(after).toBe(previous + 1);
    });

    it.each([
        `/${valid_chain}/timestamp?block_number=-1`,
        `/${valid_chain}/blocknum?timestamp=abc`,
    ])('Should log validation errors: %s', async (path: string) => {
        const previous = await sumMetric('validation_errors');
        const res = await app.request(path);
        const after = await sumMetric('validation_errors');

        expect(res.status).toBe(422);
        expect(after).toBe(previous + 1);
    });

    it('Should log rows received from DB', async () => {
        const previous = await sumMetric('rows_received');
        const res = await app.request(`/${valid_chain}/timestamp?block_number=${valid_blocknum}`);
        const after = await sumMetric('rows_received');

        const json = await res.json();

        expect(json.length).toBeGreaterThan(0);
        expect(after).toBe(previous + json.length);
    });
});