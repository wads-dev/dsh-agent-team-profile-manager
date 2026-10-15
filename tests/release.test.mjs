import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('release declares actual browser entry and exact alpha.3 host integration peers',async()=>{
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(pkg.exports['./client'],'./lib/client.js');assert.equal(pkg.dsh.client.platform,'web');
 const browser=await readFile(new URL('../lib/client.js',import.meta.url),'utf8');
 assert.ok(browser.includes('id: "dsh-agent-team-model-router"'));assert.ok(browser.includes('agentTeamDisplayNames'));
 assert.ok(browser.includes('const NS = "agent-team-model-router";'));
 assert.ok(!browser.includes('const NS = "agent-team";'));
 assert.equal(pkg.version,'0.2.1-alpha.3');
 for(const section of ['peerDependencies','devDependencies'])for(const [name,version] of Object.entries(pkg[section]))if(name.startsWith('@deepseek-ai/dsh-'))assert.equal(version,pkg.version);
 assert.equal(pkg.peerDependencies['@deepseek-ai/cordis'],'~4.0.5-alpha.2');
 assert.ok(pkg.scripts.prepack.includes('npm test'));
 const upstream=JSON.parse(await readFile(new URL('../node_modules/@deepseek-ai/dsh-experimental-client-ui-agent-team/package.json',import.meta.url),'utf8'));
 assert.deepEqual(pkg.dsh.client,upstream.dsh.client);
});
