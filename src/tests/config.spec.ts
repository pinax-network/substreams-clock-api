import { describe, expect, it, afterAll } from 'bun:test';
import config, {
	DEFAULT_PORT,
	DEFAULT_HOSTNAME,
	DEFAULT_DB_HOST,
	DEFAULT_DB_NAME,
	DEFAULT_DB_USERNAME,
	DEFAULT_DB_PASSWORD,
	DEFAULT_MAX_ELEMENTS_QUERIES,
	DEFAULT_VERBOSE,
	decode,
} from '../config';

describe('Commander', () => {
	const OLD_ENV = process.env;

	afterAll(() => {
		process.env = OLD_ENV;
	});

	it('Should load .env variables', () => {
		expect(config).toMatchObject(process.env);
	});

	it.skip('Should load default values with no arguments set', () => {
		expect(process.argv).toHaveLength(2); // Bun exec and program name
		expect(config).toMatchObject({
			port: DEFAULT_PORT,
			hostname: DEFAULT_HOSTNAME,
			dbHost: DEFAULT_DB_HOST,
			name: DEFAULT_DB_NAME,
			username: DEFAULT_DB_USERNAME,
			password: DEFAULT_DB_PASSWORD,
			maxElementsQueried: DEFAULT_MAX_ELEMENTS_QUERIES,
			verbose: DEFAULT_VERBOSE
		});
	});
});