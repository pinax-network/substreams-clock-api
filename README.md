# [`Substreams`](https://substreams.streamingfast.io/) Clock API

[![.github/workflows/bun-test.yml](https://github.com/pinax-network/substreams-clock-api/actions/workflows/bun-test.yml/badge.svg)](https://github.com/pinax-network/substreams-clock-api/actions/workflows/bun-test.yml)

> Convert Timestamps <> Block numbers and query latest blocks height for your favorite chains !

## REST API

| Pathname                                  | Description           |
|-------------------------------------------|-----------------------|
| GET `/`                                   | Banner
| GET `/chains`                             | Returns all available `chains`
| GET `/health`                             | Health check
| ~~GET `/metrics`~~ (SOON)                 | ~~Prometheus metrics~~
| GET `/openapi`                            | [OpenAPI v3 JSON](https://spec.openapis.org/oas/v3.0.0)
| GET `/swagger`                            | [Swagger UI](https://swagger.io/resources/open-api/)
| GET `/{chain}/current`                   | Latest block number on the chain
| GET `/{chain}/final`                      | Latest finalized block number on the chain
| GET `/{chain}/timestamp?block_number=`    | Timestamp query from a block number or array (comma-separated)
| GET `/{chain}/blocknum?timestamp=`        | Block number query from a timestamp or array (comma-separated)

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
# Optional
PORT=8080
HOSTNAME=localhost
DB_HOST=http://localhost:8123
DB_NAME=demo
DB_USERNAME=default
DB_PASSWORD=
```

## Help

```console
$ ./substreams-clock-api --help
Usage: substreams-clock-api [options]

Timestamps <> Block numbers conversion for your favorite chains

Options:
  --port <int>                     Server listen on HTTP port (default: "8080", env: PORT)
  --hostname <string>              Server listen on HTTP hostname (default: "localhost", env: HOST)
  --db-host <string>               Clickhouse DB HTTP hostname (default: "http://localhost:8123", env: dbHost)
  --name <string>                  Clickhouse DB table name (default: "demo", env: DB_NAME)
  --username <string>              Clickhouse DB username (default: "default", env: DB_USERNAME)
  --password <string>              Clickhouse DB password (default: "", env: DB_PASSWORD)
  --max-elements-queried <string>  Maximum number of query elements when using arrays as parameters (default: 10, env: MAX_ELEMENTS_QUERIED)
  --verbose <boolean>              Enable verbose logging (default: false, env: VERBOSE)
  -V, --version                    output the version number
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
