import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';

import config from "./config";
import { banner } from "./banner";
import { supportedChains, timestampQuery, blocknumQuery, currentBlocknumQuery } from "./queries";

const app = new Hono();

if ( config.NODE_ENV !== "production" )
    app.use('*', logger());

app.get('/', (c) => c.text(banner()));
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
    let blocknum = c.req.query('n');

    if (!(blocknum && (blocknum = parseInt(blocknum)) && blocknum > 0)) // TODO: Look into Validation (https://hono.dev/guides/validation)
        throw new HTTPException(400, {
            message: `The block number is missing or is not a valid block number (positive integer).`
        });

    return c.json(await timestampQuery(chain, blocknum));
});
app.get('/:chain/blocknum', async (c) => {
    const chain = c.req.param('chain');
    let timestamp = c.req.query('t');

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