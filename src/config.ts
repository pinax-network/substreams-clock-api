import "dotenv/config";
import { z } from '@hono/zod-openapi';
import { Option, program } from "commander";

import pkg from "../package.json";

export const DEFAULT_HTTP_PORT = "8080";
export const DEFAULT_HTTP_HOSTNAME = "localhost";
export const DEFAULT_DB_HOST = "http://localhost:8123";
export const DEFAULT_DB_TABLE = "block";
export const DEFAULT_DB_USERNAME = "default";
export const DEFAULT_DB_PASSWORD = "";
export const DEFAULT_MAX_ELEMENTS_QUERIES = 10;
export const DEFAULT_VERBOSE = false;

// parse command line options
const opts = program
    .name(pkg.name)
    .version(pkg.version)
    .description(pkg.description)
    .showHelpAfterError()
    .addOption(new Option("-p, --port <number>", "Server listen on HTTP port").env("HTTP_PORT").default(DEFAULT_HTTP_PORT))
    .addOption(new Option("--hostname <string>", "Server HTTP hostname").env("HTTP_HOST").default(DEFAULT_HTTP_HOSTNAME))
    .addOption(new Option("--db-host <string>", "Clickhouse DB HTTP hostname").env("DB_HOST").default(DEFAULT_DB_HOST))
    .addOption(new Option("--table <string>", "Clickhouse DB table name").env("DB_TABLE").default(DEFAULT_DB_TABLE))
    .addOption(new Option("--username <string>", "Clickhouse DB username").env("DB_USERNAME").default(DEFAULT_DB_USERNAME))
    .addOption(new Option("--password <string>", "Clickhouse DB password").env("DB_PASSWORD").default(DEFAULT_DB_PASSWORD))
    .addOption(new Option("--max-elements-queried <string>",
        "Maximum number of elements allowed when using arrays in query parameters (warning: setting a very high number can allow for intensive DB workload)"
        ).env("MAX_ELEMENTS_QUERIED").default(DEFAULT_MAX_ELEMENTS_QUERIES))
    .addOption(new Option("--verbose", "Enable verbose logging").env("VERBOSE").default(DEFAULT_VERBOSE))
    .parse()
    .opts();

export const config = z.object({
    port: z.string().default(DEFAULT_HTTP_PORT),
    hostname: z.string().default(DEFAULT_HTTP_HOSTNAME),
    dbHost: z.string().default(DEFAULT_DB_HOST),
    table: z.string().default(DEFAULT_DB_TABLE),
    username: z.string().default(DEFAULT_DB_USERNAME),
    password: z.string().default(DEFAULT_DB_PASSWORD),
    maxElementsQueried: z.coerce.number().gte(2).default(DEFAULT_MAX_ELEMENTS_QUERIES).describe(
        'Maximum number of query elements when using arrays as parameters'
    ),
    verbose: z.coerce.boolean().default(DEFAULT_VERBOSE),
}).parse(opts);
