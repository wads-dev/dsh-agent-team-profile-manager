import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const EXPECTED = '0.2.2-rc.2';
export function assertCompatibility(ctx) {
  for (const pkg of ['agent', 'subagent', 'tools', 'llm', 'scope', 'session', 'agent-team', 'tool-agent-team', 'session-projection', 'tool-subagent']) {
    const actual = require('@deepseek-ai/dsh-' + pkg + '/package.json').version;
    if (actual !== EXPECTED) throw new Error('agent-team-profile-manager requires DSH ' + EXPECTED + '; ' + pkg + ' is ' + actual);
  }
  for (const [service, methods] of Object.entries({ agents: ['list', 'get'], subagents: ['rootOf', 'resolveName', 'listDescendants'], llm: ['resolveCallConfig', 'resolveModelInfo', 'listProviders', 'listModels'], tools: ['register', 'get'], sessions: ['flush'], sessionProjections: ['register'], agentTeams: ['isEnabled'] })) {
    for (const method of methods) if (typeof ctx[service]?.[method] !== 'function') throw new Error('Missing DSH API: ' + service + '.' + method);
  }
}
