import pkg from "../../package.json" assert { type: "json" };

import { OpenApiBuilder, SchemaObject, ExampleObject, ParameterObject } from "openapi3-ts/oas31";
import { config } from "../config.js";
import { store } from "../clickhouse/stores.js";
import { getBlock, getAggregate, NormalizedHistoryData } from "../queries.js";
import { registry } from "../prometheus.js";
import { makeQuery } from "../clickhouse/makeQuery.js";
import { parseNormalized } from "../utils.js";

const TAGS = {
  MONITORING: "Monitoring",
  HEALTH: "Health",
  USAGE: "Usage",
  DOCS: "Documentation",
} as const;

const block_example = (await makeQuery(await getBlock( new URLSearchParams({limit: "2"})))).data;
const trace_calls_example = parseNormalized((await makeQuery<NormalizedHistoryData>(getAggregate( new URLSearchParams({aggregate_function: "count", chain: "wax"}), "trace_calls"))).data, 86400);
const transaction_traces_example = parseNormalized((await makeQuery<NormalizedHistoryData>(getAggregate( new URLSearchParams({aggregate_function: "count", chain: "wax"}), "transaction_traces"))).data, 86400);
const uaw_example = parseNormalized((await makeQuery<NormalizedHistoryData>(getAggregate( new URLSearchParams({chain: "eos", range: "24h"}), "uaw"))).data, 86400);

const timestampSchema: SchemaObject = { anyOf: [
    {type: "number"},
    {type: "string", format: "date"},
    {type: "string", format: "date-time"}
  ]
};
const timestampExamples: ExampleObject = {
  unix: { summary: `Unix Timestamp (seconds)` },
  date: { summary: `Full-date notation`, value: '2023-10-18' },
  datetime: { summary: `Date-time notation`, value: '2023-10-18T00:00:00Z'},
}
const DateSchema: SchemaObject = { anyOf: [ 
  {type: "number"},
  {type: "string", format: "date"},
  ]
};

const DateExamples: ExampleObject = {
  unix: { summary: `Unix Timestamp (seconds)`, value: 1693951200 },
  date: { summary: `Full-date notation`, value: '2023-09-06' },
}

export default new OpenApiBuilder()
  .addInfo({
    title: pkg.name,
    version: pkg.version,
    description: pkg.description,
    license: {name: pkg.license},
  })
  .addExternalDocs({ url: pkg.homepage, description: "Extra documentation" })
  .addSecurityScheme("auth-key", { type: "http", scheme: "bearer" })
  .addPath("/chains", {
    get: {
      tags: [TAGS.USAGE],
      summary: 'Supported chains',
      responses: {
        200: {
          description: "Array of chains",
          content: {
            "application/json": {
              schema: { enum: await store.chains },
            }
          },
        },
      },
    },
  })
  .addPath("/block", {
    get: {
      tags: [TAGS.USAGE],
      summary: "Get block",
      description: "Get block by `block_number`, `block_id` or `timestamp`",
      parameters: [
        {
          name: "chain",
          in: "query",
          description: "Filter by chain",
          required: false,
          schema: {enum: await store.chains},
        },
        {
          name: "block_number",
          description: "Filter by Block number (ex: 18399498)",
          in: "query",
          required: false,
          schema: { type: "number" },
        },
        {
          name: "block_id",
          in: "query",
          description: "Filter by Block hash ID (ex: 00fef8cf2a2c73266f7c0b71fb5762f9a36419e51a7c05b0e82f9e3bacb859bc)",
          required: false,
          schema: { type: "string" },
        },
        {
          name: 'timestamp',
          in: 'query',
          description: 'Filter by exact timestamp',
          required: false,
          schema: timestampSchema,
          examples: timestampExamples,
        },
        {
          name: "final_block",
          description: "If true, only returns final blocks",
          in: "query",
          required: false,
          schema: { type: "boolean" },
        },
        {
          name: "sort_by",
          in: "query",
          description: "Sort by `block_number`",
          required: false,
          schema: {enum: ['ASC', 'DESC'] },
        },
        ...["greater_or_equals_by_timestamp", "greater_by_timestamp", "less_or_equals_by_timestamp", "less_by_timestamp"].map(name => {
          return {
            name,
            in: "query",
            description: "Filter " + name.replace(/_/g, " "),
            required: false,
            schema: timestampSchema,
            examples: timestampExamples,
          } as ParameterObject
        }),
        ...["greater_or_equals_by_block_number", "greater_by_block_number", "less_or_equals_by_block_number", "less_by_block_number"].map(name => {
          return {
            name,
            in: "query",
            description: "Filter " + name.replace(/_/g, " "),
            required: false,
            schema: { type: "number" },
          } as ParameterObject
        }),
        {
          name: "limit",
          in: "query",
          description: "Used to specify the number of records to return.",
          required: false,
          schema: { type: "number", maximum: config.maxLimit, minimum: 1 },
        },
      ],
      responses: {
        200: { description: "Array of blocks", content: { "application/json": { example: block_example, schema: { type: "array" } } } },
        400: { description: "Bad request" },
      },
    },
  })
  .addPath("/trace_calls", {
    get: {
      tags: [TAGS.USAGE],
      summary: "Get aggregate of trace_calls",
      description: "Get aggregate of trace_calls for given time range filtered by `chain`",
      parameters: [
        {
          name: "aggregate_function",
          in: "query",
          description: "Aggregate function",
          required: false,
          schema: {enum: ['count', 'min', 'max', 'sum', 'avg', 'median'] },
        },
        {
          name: "chain",
          in: "query",
          description: "Filter by chain name",
          required: false,
          schema: {enum: await store.chains},
        },
        {
          name: "range",
          in: "query",
          description: "Time range to query (ex: 24h)",
          required: false,
          schema: { enum: ["24h", "7d", "30d", "90d", "1y", "all"] },
        }
      ],
      responses: {
        200: { description: "Aggregate of sales", content: { "text/plain": { example: trace_calls_example} } },
        400: { description: "Bad request", content: { "text/plain": { example: "Bad request", schema: { type: "string" } } }, },
      },
    },
  })
  .addPath("/transaction_traces", {
    get: {
      tags: [TAGS.USAGE],
      summary: "Get aggregate of transaction_traces",
      description: "Get aggregate of transaction_traces for given time range filtered by `chain`",
      parameters: [
        {
          name: "aggregate_function",
          in: "query",
          description: "Aggregate function",
          required: false,
          schema: {enum: ['count', 'min', 'max', 'sum', 'avg', 'median'] },
        },
        {
          name: "chain",
          in: "query",
          description: "Filter by chain name",
          required: false,
          schema: {enum: await store.chains},
        },
        {
          name: "range",
          in: "query",
          description: "Time range to query (ex: 24h)",
          required: false,
          schema: { enum: ["24h", "7d", "30d", "90d", "1y", "all"] },
        }
      ],
      responses: {
        200: { description: "Aggregate of sales", content: { "text/plain": { example: transaction_traces_example} } },
        400: { description: "Bad request", content: { "text/plain": { example: "Bad request", schema: { type: "string" } } }, },
      },
    },
  })
  .addPath("/uaw", {
    get: {
      tags: [TAGS.USAGE],
      summary: "Get daily unique active wallets",
      description: "Get daily unique active wallets for given time range filtered by `chain`",
      parameters: [
        {
          name: "chain",
          in: "query",
          description: "Filter by chain name",
          required: false,
          schema: {enum: await store.chains},
        },
        {
          name: "range",
          in: "query",
          description: "Time range to query (ex: 24h)",
          required: false,
          schema: { enum: ["24h", "7d", "30d", "90d", "1y", "all"] },
        }
      ],
      responses: {
        200: { description: "Daily active wallets", content: { "text/plain": { example: uaw_example} } },
        400: { description: "Bad request", content: { "text/plain": { example: "Bad request", schema: { type: "string" } } }, },
      },
    },
  })
  .addPath("/health", {
    get: {
      tags: [TAGS.HEALTH],
      summary: "Performs health checks and checks if the database is accessible",
      responses: {200: { description: "OK", content: { "text/plain": {example: "OK"}} } },
    },
  })
  .addPath("/metrics", {
    get: {
      tags: [TAGS.MONITORING],
      summary: "Prometheus metrics",
      responses: {200: { description: "Prometheus metrics", content: { "text/plain": { example: await registry.metrics(), schema: { type: "string" } } }}},
    },
  })
  .addPath("/openapi", {
    get: {
      tags: [TAGS.DOCS],
      summary: "OpenAPI specification",
      responses: {200: {description: "OpenAPI JSON Specification", content: { "application/json": { schema: { type: "string" } } } }},
    },
  })
  .getSpecAsJson();