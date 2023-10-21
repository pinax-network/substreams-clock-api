import { client } from "../config";

export interface Meta {
    name: string,
    type: string
}
export interface Query<T> {
    meta: Meta[],
    data: T[],
    rows: number,
    statistics: {
        elapsed: number,
        rows_read: number,
        bytes_read: number,
    }
}

export async function makeQuery<T = unknown>(query: string) {
    const response = await client.query({ query })
    return response.json() as Promise<Query<T>>;
}
