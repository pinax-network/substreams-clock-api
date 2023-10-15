import { z } from '@hono/zod-openapi';
import "dotenv/config";

// TODO: Add commander for build (https://github.com/pinax-network/substreams-sink-websockets/blob/main/src/config.ts)

const EnvSchema = z.object({
    NODE_ENV: z.string().optional(),
    PORT: z.string(),
    DB_HOST: z.string(),
    DB_NAME: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    MAX_ELEMENTS_QUERIED: z.coerce.number().default(10)
});

export function decode(data: unknown) {
    return EnvSchema.passthrough().parse(data); // throws on failure
}

let config: z.infer<typeof EnvSchema> = decode(process.env);
export default config!;