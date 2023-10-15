import { z } from '@hono/zod-openapi';
import "dotenv/config";
import { Command, Option } from "commander";

import pkg from "../package.json";

export const DEFAULT_PORT = "8080";
export const DEFAULT_HOSTNAME = "localhost";
export const DEFAULT_DB_HOST = "http://localhost:8123";
export const DEFAULT_DB_NAME = "demo";
export const DEFAULT_DB_USERNAME = "default";
export const DEFAULT_DB_PASSWORD = "";
export const DEFAULT_MAX_ELEMENTS_QUERIES = 10;
export const DEFAULT_VERBOSE = false;

const CommanderSchema = z.object({
    NODE_ENV: z.string().optional(),
    port: z.string().default(DEFAULT_PORT),
    hostname: z.string().default(DEFAULT_HOSTNAME),
    dbHost: z.string().default(DEFAULT_DB_HOST),
    name: z.string().default(DEFAULT_DB_NAME),
    username: z.string().default(DEFAULT_DB_USERNAME),
    password: z.string().default(DEFAULT_DB_PASSWORD),
    maxElementsQueried: z.coerce.number().default(DEFAULT_MAX_ELEMENTS_QUERIES).describe(
        'Maximum number of query elements when using arrays as parameters'
    )
});

export function decode(data: unknown) {
    return CommanderSchema.passthrough().parse(data); // throws on failure
}

// parse command line options
const opts = new Command()
    .name(pkg.name)
    .description(pkg.description)
    .showHelpAfterError()
    .addOption(new Option("--port <int>", "Server listen on HTTP port").default(DEFAULT_PORT).env("PORT"))
    .addOption(new Option("--hostname <string>", "Server listen on HTTP hostname").default(DEFAULT_HOSTNAME).env("HOST"))
    .addOption(new Option("--db-host <string>", "Clickhouse DB HTTP hostname").default(DEFAULT_DB_HOST).env("dbHost"))
    .addOption(new Option("--name <string>", "Clickhouse DB table name").default(DEFAULT_DB_NAME).env("DB_NAME"))
    .addOption(new Option("--username <string>", "Clickhouse DB username").default(DEFAULT_DB_USERNAME).env("DB_USERNAME"))
    .addOption(new Option("--password <string>", "Clickhouse DB password").default(DEFAULT_DB_PASSWORD).env("DB_PASSWORD"))
    .addOption(new Option("--max-elements-queried <string>", "Maximum number of query elements when using arrays as parameters")
        .default(DEFAULT_MAX_ELEMENTS_QUERIES).env("MAX_ELEMENTS_QUERIED"))
    .addOption(new Option("--verbose <boolean>", "Enable verbose logging").default(DEFAULT_VERBOSE).env("VERBOSE")) // TODO: Use verbose logging
    .version(pkg.version)
    .parse(process.argv).opts();

let config: z.infer<typeof CommanderSchema> = decode({...opts, ...process.env});
export default config!;