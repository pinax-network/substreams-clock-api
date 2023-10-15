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

	it('Should throw on missing .env variables', () => {
		const { PORT, ...wrong_env } = process.env; // wrong_env will be missing required field PORT

		expect(() => decode(wrong_env)).toThrow();
	});
});