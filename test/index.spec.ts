import { describe, expect, it } from 'bun:test';

import app from '../src/index';
import { banner } from "../src/banner";

describe('Index page (/)', () => {
  it('Should return 200 Response', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
  });

  it('Should have the banner as the body', async () => {
    const res = await app.request('/');
    expect(await res.text()).toBe(banner());
  });
});