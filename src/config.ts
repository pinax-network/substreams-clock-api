import "dotenv/config";
import { z } from '@hono/zod-openapi';
import { Option, program } from "commander";

import pkg from "../package.json";
import { createClient } from "./clickhouse/createClient";

export const DEFAULT_PORT = "8080";
export const DEFAULT_HOSTNAME = "localhost";
export const DEFAULT_DB_HOST = "http://localhost:8123";
export const DEFAULT_DB_TABLE = "block";
export const DEFAULT_DB_USERNAME = "default";
export const DEFAULT_DB_PASSWORD = "";
export const DEFAULT_MAX_ELEMENTS_QUERIES = 500;
export const DEFAULT_VERBOSE = false;
export const APP_NAME = pkg.name;

// parse command line options
const opts = program
    .name(pkg.name)
    .version(pkg.version)
    .description(pkg.description)
    .showHelpAfterError()
    .addOption(new Option("-p, --port <number>", "Server listen on HTTP port").env("PORT").default(DEFAULT_PORT))
    .addOption(new Option("--hostname <string>", "Server HTTP hostname").env("HOSTNAME").default(DEFAULT_HOSTNAME))
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
    port: z.string(),
    hostname: z.string(),
    dbHost: z.string(),
    table: z.string(),
    username: z.string(),
    password: z.string(),
    maxElementsQueried: z.coerce.number().gte(2).describe(
        'Maximum number of query elements when using arrays as parameters'
    ),
    verbose: z.coerce.boolean(),
}).parse(opts);

export const client = createClient();