const assert = require('node:assert/strict');
const test = require('node:test');
const { checkGatewayRequirements } = require('../src/services/github');

test('checkGatewayRequirements bypasses checks for creator account (sairaman436)', async () => {
  const result = await checkGatewayRequirements('sairaman436', 'some-token');
  assert.deepEqual(result, { followed: true, starred: true });

  const resultCase = await checkGatewayRequirements('Sairaman436', null);
  assert.deepEqual(resultCase, { followed: true, starred: true });
});

test('checkGatewayRequirements returns followed=true, starred=true when user has starred and followed (using token)', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    if (url.includes('/following/sairaman436')) {
      return { status: 204 };
    }
    if (url.includes('/starred/sairaman436/CODE-DNA')) {
      return { status: 204 };
    }
    return { status: 404 };
  };

  const result = await checkGatewayRequirements('alice', 'valid-token');
  assert.deepEqual(result, { followed: true, starred: true });
});

test('checkGatewayRequirements returns followed=false, starred=false when user has not starred and followed (using token)', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    if (url.includes('/following/sairaman436')) {
      return { status: 404 };
    }
    if (url.includes('/starred/sairaman436/CODE-DNA')) {
      return { status: 404 };
    }
    return { status: 404 };
  };

  const result = await checkGatewayRequirements('alice', 'valid-token');
  assert.deepEqual(result, { followed: false, starred: false });
});

test('checkGatewayRequirements falls back to public check when no access token is provided', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  let starredUrlChecked = false;
  let followedUrlChecked = false;

  global.fetch = async (url) => {
    if (url.includes('/users/bob/following/sairaman436')) {
      followedUrlChecked = true;
      return { status: 204 };
    }
    if (url.includes('/users/bob/starred')) {
      starredUrlChecked = true;
      return {
        ok: true,
        json: async () => [
          { full_name: 'some/other-repo' },
          { full_name: 'sairaman436/CODE-DNA' }
        ]
      };
    }
    return { status: 404 };
  };

  const result = await checkGatewayRequirements('bob', null);
  assert.equal(followedUrlChecked, true);
  assert.equal(starredUrlChecked, true);
  assert.deepEqual(result, { followed: true, starred: true });
});
