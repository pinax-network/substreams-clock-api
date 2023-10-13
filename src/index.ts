import { OpenAPIHono } from '@hono/zod-openapi';
import { serveStatic } from 'hono/bun'
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

import * as routes from './routes';
import config from "./config";
import { banner } from "./banner";
import { supportedChainsQuery, timestampQuery, blocknumQuery, currentBlocknumQuery, finalBlocknumQuery } from "./queries";

const app = new OpenAPIHono();

if ( config.NODE_ENV !== "production" )
    app.use('*', logger());

app.use('/static/*', serveStatic({ root: './' }))

// The OpenAPI documentation will be available at /doc
app.doc('/doc', {
    openapi: '3.0.0',
    info: {
        version: '0.0.1',
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

app.openapi(routes.indexRoute, (c) => c.text(banner()));

app.openapi(routes.healthCheckRoute, async (c) => {
    const start = performance.now();
    const dbStatus = await fetch(`${config.DB_HOST}/ping`).then(async (r) => {
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
    return c.json(await dbStatus.json());
});

app.openapi(routes.supportedChainsRoute, async (c) => c.json({ supportedChains: await supportedChainsQuery() }));

app.openapi(routes.timestampQueryRoute, async (c) => {
    const { chain } = c.req.valid('param');
    const { block_number } = c.req.valid('query');

    return c.json(await timestampQuery(chain, block_number));
});

app.openapi(routes.blocknumQueryRoute, async (c) => {
    const { chain } = c.req.valid('param');
    const { timestamp } = c.req.valid('query');

    return c.json(await blocknumQuery(chain, timestamp));
});

app.openapi(routes.currentBlocknumQueryRoute, async (c) => {
    const { chain } = c.req.valid('param');

    return c.json(await currentBlocknumQuery(chain));
});

app.openapi(routes.finalBlocknumQueryRoute, async (c) => {
    const { chain } = c.req.valid('param');

    return c.json(await finalBlocknumQuery(chain));
});

export default app;