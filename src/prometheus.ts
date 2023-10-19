// From https://github.com/pinax-network/substreams-sink-websockets/blob/main/src/prometheus.ts
import client, { Counter, CounterConfiguration, Gauge, GaugeConfiguration } from 'prom-client';

export const registry = new client.Registry();

// Metrics
export function registerCounter(name: string, help = "help", labelNames: string[] = [], config?: CounterConfiguration<string>) {
    try {
        registry.registerMetric(new Counter({ name, help, labelNames, ...config }));
        return registry.getSingleMetric(name) as Counter;
    } catch (e) {
        console.error({name, e});
        throw new Error(`${e}`);
    }
}

export function registerGauge(name: string, help = "help", labelNames: string[] = [], config?: GaugeConfiguration<string>) {
    try {
        registry.registerMetric(new Gauge({ name, help, labelNames, ...config }));
        return registry.getSingleMetric(name) as Gauge;
    } catch (e) {
        console.error({name, e});
        throw new Error(`${e}`);
    }
}

export async function getSingleMetric(name: string) {
    const metric = registry.getSingleMetric(name);
    const get = await metric?.get();
    return get?.values[0].value;
}

// REST API metrics
export const api_server_errors = registerCounter('server_errors', 'Total of server errors');
export const api_validation_errors = registerCounter('validation_errors', 'Total of query parameters validation errors');
export const api_successful_queries = registerCounter('successful_queries', 'Total of successful queries', ['path']);
export const api_failed_queries = registerCounter('failed_queries', 'Total of failed queries', ['path']);
export const api_rows_received = registerCounter('rows_received', 'Total of rows received from Clickhouse DB');

// Gauge example
// export const connection_active = registerGauge('connection_active', 'Total WebSocket active connections');
