import { OpenAPIHono } from '@hono/zod-openapi';
import { type Context, type TypedResponse } from 'hono';
import { serveStatic } from 'hono/bun'
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { type Serve } from "bun";

import * as routes from './routes';
import * as metrics from "./prometheus";
import config from "./config";
import { http_logger } from "./logger";
import pkg from "../package.json";
import {
    type BlockchainSchema, type BlocknumSchema, type TimestampSchema,
    type BlocktimeQueryResponsesSchema, type SingleBlocknumQueryResponseSchema, type SupportedChainsQueryResponseSchema
} from './schemas';
import { banner } from "./banner";
import { supportedChainsQuery, timestampQuery, blocknumQuery, currentBlocknumQuery, finalBlocknumQuery } from "./queries";

function JSONAPIResponseWrapper<T>(c: Context, res: T) {
    metrics.api_successful_queries.labels({ path: c.req.url }).inc();
    http_logger.debug("Return data:", `\n${JSON.stringify(res, null, 4)}`);

    return {
        response: c.json(res)
    } as TypedResponse<T>;
}

// Export app as a function to be able to create it in tests as well.
// Default export is different for setting Bun port/hostname than running tests.
// See (https://hono.dev/getting-started/bun#change-port-number) vs. (https://hono.dev/getting-started/bun#_3-hello-world)
export function generateApp() {
    const app = new OpenAPIHono({
        defaultHook: (result, c) => {
            if (!result.success) {
                metrics.api_validation_errors.labels({ path: c.req.url }).inc();

                return {
                    response: c.json(result, 422)
                } as TypedResponse<typeof result>;
            }
        },
    });

    if ( config.verbose )
        http_logger.enable();

    app.use('*', async (c, next) => {
        const start = Date.now();
        const query_parameters = c.req.query();
        const has_query_params = Object.keys(query_parameters).length > 0;

        http_logger.info("-->", c.req.method, c.req.path, has_query_params ? `\n${JSON.stringify(query_parameters, null, 4)}` : "");

        metrics.api_total_queries.inc();
        await next();
        
        const delta = Date.now() - start;
        const elapsed_time = delta < 1000 ? delta + 'ms' : Math.round(delta / 1000) + 's';

        const method = c.req.method;
        const path = c.req.path;
        const status = c.res.status;

        if (status !== 200)
            http_logger.error("<--", `(${elapsed_time})`, method, status, path);
        else
            http_logger.info("<--", `(${elapsed_time})`, method, status, path);
    });

    app.use('/swagger/*', serveStatic({ root: './' }));

    app.doc('/openapi', {
        openapi: '3.0.0',
        info: {
            version: pkg.version,
            title: 'Clock API',
        },
    });

    app.notFound((c) => {
        metrics.api_notfound_errors.labels({ path: c.req.url }).inc();

        return c.json({ error_message: 'Not found' }, 404);
    });

    app.onError((err, c) => {
        let error_message = `${err}`;
        let error_code = 500;

        if (err instanceof HTTPException){
            error_message = err.message;
            error_code = err.status;
        }

        metrics.api_server_errors.labels({ path: c.req.url }).inc();
        return c.json({ error_message }, error_code);
    });

    app.openapi(routes.indexRoute, (c) => {
        metrics.api_successful_queries.labels({ path: c.req.url }).inc();
        return {
            response: c.text(banner())
        } as TypedResponse<string>;
    });

    app.openapi(routes.healthCheckRoute, async (c) => {
        const start = performance.now();
        const dbStatus = await fetch(`${config.dbHost}/ping`).then(async (r) => {
            return Response.json({
                db_status: await r.text(),
                db_response_time_ms: performance.now() - start
            }, r);
        }).catch((error) => {
            return Response.json({
                db_status: error.code,
                db_response_time_ms: performance.now() - start
            }, { status: 503 });
        });

        c.status(dbStatus.status);
        return JSONAPIResponseWrapper<typeof dbStatus>(c, await dbStatus.json());
    });

    app.openapi(routes.metricsRoute, async (c) => {
        const metrics_json = await metrics.registry.getMetricsAsJSON();

        return JSONAPIResponseWrapper<typeof metrics_json>(c, metrics_json);
    });

    app.openapi(routes.supportedChainsRoute, async (c) => {
        return JSONAPIResponseWrapper<SupportedChainsQueryResponseSchema>(c, { supportedChains: await supportedChainsQuery() });
    });

    app.openapi(routes.timestampQueryRoute, async (c) => {
        // @ts-expect-error: Suppress type of parameter expected to be never (see https://github.com/honojs/middleware/issues/200)
        const { chain } = c.req.valid('param') as BlockchainSchema;
        // @ts-expect-error: Suppress type of parameter expected to be never (see https://github.com/honojs/middleware/issues/200)
        const { block_number } = c.req.valid('query') as BlocknumSchema;

        return JSONAPIResponseWrapper<BlocktimeQueryResponsesSchema>(c, await timestampQuery(chain, block_number));
    });

    app.openapi(routes.blocknumQueryRoute, async (c) => {
        // @ts-expect-error: Suppress type of parameter expected to be never (see https://github.com/honojs/middleware/issues/200)
        const { chain } = c.req.valid('param') as BlockchainSchema;
        // @ts-expect-error: Suppress type of parameter expected to be never (see https://github.com/honojs/middleware/issues/200)
        const { timestamp } = c.req.valid('query') as TimestampSchema;

        return JSONAPIResponseWrapper<BlocktimeQueryResponsesSchema>(c, await blocknumQuery(chain, timestamp));
    });

    app.openapi(routes.currentBlocknumQueryRoute, async (c) => {
        const { chain } = c.req.valid('param') as BlockchainSchema;

        return JSONAPIResponseWrapper<SingleBlocknumQueryResponseSchema>(c, await currentBlocknumQuery(chain));
    });

    /*app.openapi(routes.finalBlocknumQueryRoute, async (c) => {
        const { chain } = c.req.valid('param') as BlockchainSchema;

        return JSONAPIResponseWrapper<SingleBlocknumQueryResponseSchema>(c, await finalBlocknumQuery(chain));
    });*/

    return app;
}

export default {
    port: config.port,
    hostname: config.hostname,
    fetch: generateApp().fetch
} as Serve;
