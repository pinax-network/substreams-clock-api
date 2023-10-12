import { StaticDecode, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import "dotenv/config";

const EnvSchema = Type.Object({
    PORT: Type.String(),
    DB_HOST: Type.String(),
    DB_NAME: Type.String(),
    DB_USERNAME: Type.String(),
    DB_PASSWORD: Type.String(),
});

export function decode(schema = EnvSchema) {
    try {
        return Value.Decode(schema, process.env);
    } catch {
        console.error("Could not load config: ");
        for (const err of Value.Errors(schema, process.env)) {
            console.error(err);
        }

        throw new Error('Error loading .env config');
    }
}

let config: StaticDecode<typeof EnvSchema> = decode();
export default config!;