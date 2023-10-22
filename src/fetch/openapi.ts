import pkg from "../../package.json" assert { type: "json" };

import { OpenApiBuilder } from "openapi3-ts/oas31";
import { config } from "../config";
import { getBlock } from "../queries";
import { registry } from "../prometheus";
import { makeQuery } from "../clickhouse/makeQuery";
import { supportedChainsQuery } from "./chains";

const TAGS = {
  MONITORING: "Monitoring",
  HEALTH: "Health",
  USAGE: "Usage",
  DOCS: "Documentation",
} as const;

const chains = await supportedChainsQuery();
const block_example = (await makeQuery(await getBlock( new URLSearchParams({limit: "2"})))).data;

export default new OpenApiBuilder()
  .addInfo({
    title: pkg.name,
    version: pkg.version,
    description: pkg.description,
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
              schema: { type: "array" },
              example: chains,
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
          schema: {enum: chains},
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
          description: 'Timestamp in UTC milliseconds (ex: 1697908576275)',
          required: false,
          schema: { type: "number" },
        },
        {
          name: "final_block",
          description: "If true, only returns final blocks",
          in: "query",
          required: false,
          schema: { type: "boolean" },
          example: true,
        },
        {
          name: "limit",
          in: "query",
          description: "Used to specify the number of records to return.",
          required: false,
          schema: { default: 1, type: "number", maximum: config.maxLimit, minimum: 1 },
        },
        {
          name: "sort_by",
          in: "query",
          description: "Sort by `block_number`",
          required: false,
          schema: {enum: ['ASC', 'DESC'], default: 'DESC'},
        },
      ],
      responses: {
        200: { description: "Array of blocks", content: { "application/json": { example: block_example, schema: { type: "array" } } } },
        400: { description: "Bad request" },
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