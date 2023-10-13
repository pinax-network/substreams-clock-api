import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';

import config from "./config";
import { banner } from "./banner";
import { supportedChains, timestampQuery, blocknumQuery, currentBlocknumQuery, finalBlocknumQuery } from "./queries";

const app = new Hono(); // TODO: Replace with OpenAPI middleware

if ( config.NODE_ENV !== "production" )
    app.use('*', logger());

app.get('/', (c) => c.text(banner()));
//app.get('/metrics', (c) => c.text(banner())); // TODO: Implement metrics for 'current', 'final' and 'stats' for each chain + global ?
app.get('/health', async (c) => {
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
app.get('/chains', (c) => c.json({ supportedChains: supportedChains() }));
app.use('/:chain/*', async (c, next) => {
    const chain = c.req.param('chain');

    if (!supportedChains().includes(chain))
        throw new HTTPException(400, {
            message: `The blockchain specified is currently not supported. See /chains for a list of supported blockchains.`
        });

    await next();
});
app.get('/:chain/timestamp', async (c) => {
    const chain = c.req.param('chain');
    let blocknum = c.req.query('block_number'); // TODO: Support for array of block numbers

    if (!(blocknum && (blocknum = parseInt(blocknum)) && blocknum > 0)) // TODO: Look into Validation (https://hono.dev/guides/validation)
        throw new HTTPException(400, {
            message: `The block number is missing or is not a valid block number (positive integer).`
        });

    return c.json(await timestampQuery(chain, blocknum));
});
app.get('/:chain/blocknum', async (c) => {
    const chain = c.req.param('chain');
    let timestamp = c.req.query('timestamp'); // TODO: Support for array of timestamps

    if (!timestamp || !(timestamp = isNaN(timestamp) ? new Date(timestamp) : new Date(parseInt(timestamp))))
        throw new HTTPException(400, {
            message: `The timestamp is missing or is not a valid timestamp (UNIX or date).`
        });

    return c.json(await blocknumQuery(chain, timestamp));
});
app.get('/:chain/current', async (c) => {
    const chain = c.req.param('chain');

    return c.json(await currentBlocknumQuery(chain));
});
app.get('/:chain/final', async (c) => {
    const chain = c.req.param('chain');

    return c.json(await finalBlocknumQuery(chain));
});

app.onError((err, c) => {
    let error_message = `${err}`;
    let error_code = 500;

    if (err instanceof HTTPException){
        error_message = err.message;
        error_code = err.status;
    }

    return c.json({ message: error_message }, error_code);
});

export default app;