import { describe, expect, it, afterAll } from 'bun:test';
import {
	DEFAULT_HTTP_PORT,
	DEFAULT_HTTP_HOSTNAME,
	DEFAULT_DB_HOST,
	DEFAULT_DB_TABLE,
	DEFAULT_DB_USERNAME,
	DEFAULT_DB_PASSWORD,
	DEFAULT_MAX_ELEMENTS_QUERIES,
	DEFAULT_VERBOSE,
	config
} from '../config';

describe('Commander', () => {
	it('Should load default values with no arguments set', () => {
		expect(process.argv).toHaveLength(2); // Bun exec and program name
		expect(config).toMatchObject({
			port: DEFAULT_HTTP_PORT,
			hostname: DEFAULT_HTTP_HOSTNAME,
			dbHost: DEFAULT_DB_HOST,
			table: DEFAULT_DB_TABLE,
			username: DEFAULT_DB_USERNAME,
			password: DEFAULT_DB_PASSWORD,
			maxElementsQueried: DEFAULT_MAX_ELEMENTS_QUERIES,
			verbose: DEFAULT_VERBOSE
		});
	});
});
