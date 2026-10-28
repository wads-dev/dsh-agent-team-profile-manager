import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
await mkdir(new URL('../lib/', import.meta.url), { recursive: true });
await cp(new URL('../src/', import.meta.url), new URL('../lib/', import.meta.url), { recursive: true });
let client = await readFile(new URL(import.meta.resolve('@deepseek-ai/dsh-experimental-client-ui-agent-team/client')), 'utf8');
const original = '@deepseek-ai/dsh-experimental-client-ui-agent-team';
client = client.replaceAll(original, 'dsh-agent-team-profile-manager');
const needle = 'const team = useSessions((state) => state.projectionsBySession[leadSessionId]?.values.agentTeam);';
if (!client.includes(needle) || !client.includes('order: -20,')) throw new Error('Incompatible rc.3 Team panel source');
client = client.replace(needle,   'const baseTeam = useSessions((state) => state.projectionsBySession[leadSessionId]?.values.agentTeam);\n' +
  'const aliases = useSessions((state) => state.projectionsBySession[leadSessionId]?.values.agentTeamDisplayNames);\n' +
  'const team = baseTeam === undefined ? undefined : { ...baseTeam, members: baseTeam.members.map(member => ({ ...member, name: aliases?.[member.id] ?? member.name })) };');
client = client.replace('order: -20,', 'order: -20, priority: -10,');
if (!client.includes('const NS = "agent-team";')) throw new Error('Incompatible rc.3 locale namespace');
client = client.replace('const NS = "agent-team";', 'const NS = "agent-team-profile-manager";');
client = client.split('\n').filter(line => !line.startsWith('//# sourceMappingURL=')).join('\n');
await writeFile(new URL('../lib/client.js', import.meta.url), '// rc.3 upstream Team panel (MIT), isolated alias-aware slot override. See NOTICE.\n' + client);
console.log('Built ESM host plugin and alias-aware rc.3 browser panel');
