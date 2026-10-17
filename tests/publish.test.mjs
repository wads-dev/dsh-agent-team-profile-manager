import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('publication follows tokenless Live Voice OIDC pattern', async () => {
  const workflow = await readFile(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8');
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const tag = pkg.version.includes('-') ? pkg.version.split('-')[1].split('.')[0] : 'latest';
  assert.equal(pkg.publishConfig.tag, tag);
  assert.ok(workflow.includes('id-token: write'));
  assert.ok(workflow.includes('environment: npm'));
  assert.ok(workflow.includes('npm install --global npm@11.10.1'));
  assert.ok(workflow.includes('npm publish --provenance --access public --tag "$DIST_TAG"'));
  assert.ok(workflow.includes('DIST_TAG: ${{ steps.release.outputs.tag }}'));
  assert.ok(!/NPM_TOKEN|NODE_AUTH_TOKEN|npm dist-tag add|registry-url:/.test(workflow));
  assert.ok(workflow.indexOf('name: Create version tag') < workflow.indexOf('name: Publish package using OIDC'));
});
