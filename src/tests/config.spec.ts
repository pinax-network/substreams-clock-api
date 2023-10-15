import { describe, expect, it, afterAll } from 'bun:test';
import config, { decode } from '../config';

describe('Config from .env', () => {
	const OLD_ENV = process.env;

	afterAll(() => {
		process.env = OLD_ENV;
	});

	it('Should load .env variables', () => {
		expect(config).toEqual(process.env);
	});

	it('Should not load .env variables with wrong types', () => {
		process.env.PORT = process.env.port;

		expect(() => decode()).toThrow();
	});
});