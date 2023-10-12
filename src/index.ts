import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { banner } from "./banner";
import { supportedChains, timestampQuery, blocknumQuery, currentBlocknumQuery } from "./queries";

const app = new Hono();

app.get('/', (c) => c.text(banner()));
app.get('/chains', (c) => c.json({ supportedChains: supportedChains() }));
app.get('/:chain/timestamp', async (c) => {
    const chain = c.req.param('chain');
    let blocknum = c.req.query('n');

    if (!supportedChains().includes(chain))
        throw new HTTPException(400, {
            message: `The blockchain specified is currently not supported. See /chains for a list of supported blockchains.`
        });

    if (!(blocknum && (blocknum = parseInt(blocknum)) && blocknum > 0))
        throw new HTTPException(400, {
            message: `The block number is missing or is not a valid block number (positive integer).`
        });

    return c.json(await timestampQuery(chain, blocknum));
});
app.get('/:chain/blocknum', async (c) => {
    const chain = c.req.param('chain');
    let timestamp = c.req.query('t');

    if (!supportedChains().includes(chain))
        throw new HTTPException(400, {
            message: `The blockchain specified is currently not supported. See /chains for a list of supported blockchains.`
        });

    if (!timestamp || !(timestamp = isNaN(timestamp) ? new Date(timestamp) : new Date(parseInt(timestamp))))
        throw new HTTPException(400, {
            message: `The timestamp is missing or is not a valid timestamp (UNIX or date).`
        });

    return c.json(await blocknumQuery(chain, timestamp));
});
app.get('/:chain/current', async (c) => {
    const chain = c.req.param('chain');

    if (!supportedChains().includes(chain))
        throw new HTTPException(400, {
            message: `The blockchain specified is currently not supported. See /chains for a list of supported blockchains.`
        });

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