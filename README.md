# [`Substreams`](https://substreams.streamingfast.io/) Clock API

[![.github/workflows/bun-test.yml](https://github.com/pinax-network/substreams-clock-api/actions/workflows/bun-test.yml/badge.svg)](https://github.com/pinax-network/substreams-clock-api/actions/workflows/bun-test.yml)

> Convert Timestamps <> Block numbers and query latest blocks height for your favorite chains !

## REST API

| Pathname                                  | Description           |
|-------------------------------------------|-----------------------|
| GET `/chains`                             | Available `chains`
| GET `/block`                              | Get block by `block_number`, `block_id` or `timestamp`
| GET `/health`                             | Health check
| GET `/metrics`                            | Prometheus metrics
| GET `/openapi`                            | [OpenAPI v3 JSON](https://spec.openapis.org/oas/v3.0.0)

**Important note regarding `timestamp` query parameter**

Expects **UTC** datetime or UNIX-like timestamp for matching the data in the Clickhouse DB. Passing `timestamp` data with additional timezone information (such as `...T...Z` or `±hh`) will likely fail the query to match (unless it corresponds to UTC0).

## Requirements

- [Clickhouse](clickhouse.com/)

Additionnaly to pull data directly from a substream:
- [Substreams Sink Clickhouse](https://github.com/pinax-network/substreams-sink-clickhouse/)

## Quickstart

```console
$ bun install
$ bun dev
```

## [`Bun` Binary Releases](https://github.com/pinax-network/substreams-sink-websockets/releases)

> Linux Only

```console
$ wget https://github.com/pinax-network/substreams-clock-api/releases/download/v0.2.0/substreams-clock-api
$ chmod +x ./substreams-clock-api
```

## `.env` Environment variables

```env
# API Server
PORT=8080
HOSTNAME=0.0.0.0
MAX_ELEMENTS_QUERIED=10

# Clickhouse Database
HOST=http://127.0.0.1:8123
DATABASE=default
USERNAME=default
PASSWORD=
TABLE=block

# Logging
VERBOSE=true
```

## Help

```console
$ ./substreams-clock-api -h
Usage: substreams-clock-api [options]

Timestamps <> Block numbers conversion for your favorite chains

Options:
  -V, --version                    output the version number
  -p, --port <number>              HTTP port on which to attach the API (default: "8080", env: PORT)
  -v, --verbose <boolean>          Enable verbose logging (choices: "true", "false", default: false, env: VERBOSE)
  --hostname <string>              Server listen on HTTP hostname (default: "localhost", env: HOSTNAME)
  --host <string>                  Database HTTP hostname (default: "http://localhost:8123", env: HOST)
  --username <string>              Database user (default: "default", env: USERNAME)
  --password <string>              Password associated with the specified username (default: "", env: PASSWORD)
  --database <string>              The database to use inside ClickHouse (default: "default", env: DATABASE)
  --table <string>                 Clickhouse table name (default: "block", env: TABLE)
  --max-elements-queried <string>  Maximum number of elements allowed when using arrays in query parameters (warning: setting a
                                   very high number can allow for intensive DB workload) (default: 500, env: MAX_ELEMENTS_QUERIED)
  -h, --help                       display help for command
```

## Docker environment

Pull from GitHub Container registry
```bash
docker pull ghcr.io/pinax-network/substreams-clock-api:latest
```

Build from source
```bash
docker build -t substreams-clock-api .
```

Run with `.env` file
```bash
docker run -it --rm --env-file .env ghcr.io/pinax-network/substreams-clock-api
```
