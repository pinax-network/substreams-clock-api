import { OpenAPIHono } from '@hono/zod-openapi';
import { TypedResponse } from 'hono';
import { serveStatic } from 'hono/bun'
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

import * as routes from './routes';
import config from "./config";
import pkg from "../package.json";
import {
    type BlockchainSchema, type BlocknumSchema, type TimestampSchema,
    type BlocktimeQueryResponseSchema, type SingleBlocknumQueryResponseSchema, type SupportedChainsQueryResponseSchema
} from './schemas';
import { banner } from "./banner";
import { supportedChainsQuery, timestampQuery, blocknumQuery, currentBlocknumQuery, finalBlocknumQuery } from "./queries";

// Export app as a function to be able to create it in tests as well.
// Default export is different for setting Bun port/hostname than running tests.
// See (https://hono.dev/getting-started/bun#change-port-number) vs. (https://hono.dev/getting-started/bun#_3-hello-world)
export function generateApp() {
    const app = new OpenAPIHono();

    if ( config.NODE_ENV !== "production" )
        app.use('*', logger()); // TODO: Custom logger based on config.verbose

    app.use('/swagger/*', serveStatic({ root: './' }));

    app.doc('/openapi', {
        openapi: '3.0.0',
        info: {
            version: pkg.version,
            title: 'Clock API',
        },
    });

    app.onError((err, c) => {
        let error_message = `${err}`;
        let error_code = 500;

        if (err instanceof HTTPException){
            error_message = err.message;
            error_code = err.status;
        }

        return c.json({ error_message }, error_code);
    });

    app.openapi(routes.indexRoute, (c) => {
        return {
            response: c.text(banner())
        } as TypedResponse<string>;
    });

    app.openapi(routes.healthCheckRoute, async (c) => {
        type DBStatusResponse = {
            db_status: string,
            db_response_time_ms: number
        };

        const start = performance.now();
        const dbStatus = await fetch(`${config.dbHost}/ping`).then(async (r) => {
            return Response.json({
                db_status: await r.text(),
                db_response_time_ms: performance.now() - start
            } as DBStatusResponse, r);
        }).catch((error) => {
            return Response.json({
                db_status: error.code,
                db_response_time_ms: performance.now() - start
            } as DBStatusResponse, { status: 503 });
        });

        c.status(dbStatus.status);
        return {
            response: c.json(await dbStatus.json())
        } as TypedResponse<DBStatusResponse>;
    });

    app.openapi(routes.supportedChainsRoute, async (c) => {
        return {
            response: c.json({ supportedChains: await supportedChainsQuery() })
        } as TypedResponse<SupportedChainsQueryResponseSchema>;
    });

    app.openapi(routes.timestampQueryRoute, async (c) => {
        // @ts-expect-error: Suppress type of parameter expected to be never (see https://github.com/honojs/middleware/issues/200)
        const { chain } = c.req.valid('param') as BlockchainSchema;
        // @ts-expect-error: Suppress type of parameter expected to be never (see https://github.com/honojs/middleware/issues/200)
        const { block_number } = c.req.valid('query') as BlocknumSchema;

        return {
            response: c.json(await timestampQuery(chain, block_number))
        } as TypedResponse<BlocktimeQueryResponseSchema>;
    });

    app.openapi(routes.blocknumQueryRoute, async (c) => {
        // @ts-expect-error: Suppress type of parameter expected to be never (see https://github.com/honojs/middleware/issues/200)
        const { chain } = c.req.valid('param') as BlockchainSchema;
        // @ts-expect-error: Suppress type of parameter expected to be never (see https://github.com/honojs/middleware/issues/200)
        const { timestamp } = c.req.valid('query') as TimestampSchema;

        return {
            response: c.json(await blocknumQuery(chain, timestamp))
        } as TypedResponse<BlocktimeQueryResponseSchema>;
    });

    app.openapi(routes.currentBlocknumQueryRoute, async (c) => {
        const { chain } = c.req.valid('param') as BlockchainSchema;

        return {
            response: c.json(await currentBlocknumQuery(chain))
        } as TypedResponse<SingleBlocknumQueryResponseSchema>;
    });

    app.openapi(routes.finalBlocknumQueryRoute, async (c) => {
        const { chain } = c.req.valid('param') as BlockchainSchema;

        return {
            response: c.json(await finalBlocknumQuery(chain))
        } as TypedResponse<SingleBlocknumQueryResponseSchema>;
    });

    return app;
}

export default {
    port: config.port,
    hostname: config.hostname,
    fetch: generateApp().fetch
};
