import { describe, expect, it } from 'vitest';

import { loadConfig } from '../../src/config.js';

describe('loadConfig', () => {
  it('parses VIKA_PROXY_URL', () => {
    const config = loadConfig({
      VIKA_HOST: 'https://vika.cn',
      VIKA_TOKEN: 'secret-token',
      VIKA_PROXY_URL: 'http://proxy.test:8080',
    });

    expect(config.proxyUrl).toBe('http://proxy.test:8080');
  });
});
