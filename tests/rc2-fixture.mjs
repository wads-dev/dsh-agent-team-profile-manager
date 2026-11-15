import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import AgentLoop from '@deepseek-ai/dsh-agent-loop';
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit';
import * as Persistence from '@deepseek-ai/dsh-session-persistence-jsonl';
import FsLocal from '@deepseek-ai/dsh-fs-local';
import WorkingDirectory from '@deepseek-ai/dsh-working-directory';
import Subagents from '@deepseek-ai/dsh-subagent';
import * as Spawn from '@deepseek-ai/dsh-subagent-spawn-in-process';
import * as Fork from '@deepseek-ai/dsh-subagent-fork-in-process';
import Teams from '@deepseek-ai/dsh-agent-team';
import * as SubagentTool from '@deepseek-ai/dsh-tool-subagent';
import ModelSettings from '@deepseek-ai/dsh-tool-subagent/model-selection-settings';
import * as Router from '../lib/index.js';
import { SessionId } from '@deepseek-ai/dsh-session';
import { MockAdapter } from './adapter.mjs';
import { TestSessionQuery } from './query.mjs';
export const signal = new AbortController().signal;
export async function until(predicate) {
  for (let i=0;i<500;i++) { if (await predicate()) return; await new Promise(resolve=>setTimeout(resolve,10)); }
  throw new Error('Timed out waiting for runtime state');
}
export async function setup(t, script, options={}) {
  const ctx=new Context(); t.after(()=>ctx.fiber.dispose());
  await mountAgentLoopTestDependencies(ctx);
  const root=options.root ?? await mkdtemp(join(tmpdir(),'profile-rc2-'));
  await ctx.plugin(Persistence,{root}); await ctx.plugin(TestSessionQuery);
  await ctx.plugin(AgentLoop,{agents:[]}); await ctx.plugin(FsLocal);
  await ctx.plugin(WorkingDirectory,{defaultDirectory:root});
  await ctx.plugin(Subagents); await ctx.plugin(Spawn,{providerName:'spawn'}); await ctx.plugin(Fork,{providerName:'fork'});
  await ctx.plugin(Teams,{defaultEnabled:true});
  await ctx.plugin(ModelSettings,{enabled:options.authorized!==false,allowedModels:[{provider:'one',model:'A'},{provider:'two',model:'B'}]});
  await ctx.plugin(SubagentTool,{provider:'spawn',toolName:'subagent',modelSelection:true,maxDepth:3});
  await ctx.plugin(SubagentTool,{provider:'fork',toolName:'subagent_fork',modelSelection:true,maxDepth:3});
  const adapter=new MockAdapter(script,{efforts:[{id:'low',name:'Low'},{id:'high',name:'High'}],defaultEffort:'low'});
  const original=adapter.resolveModel.bind(adapter);
  adapter.resolveModel=async(provider,model)=>{if(!['A','B'].includes(model))throw new Error('unknown model');return original(provider,model);};
  ctx.llm.registerAdapter(['one','two'],adapter);
  const fiber=await ctx.plugin(Router);
  const handle=options.resume ? await ctx.agents.resume({resumeSessionId:SessionId('lead'),agentOptions:{provider:'one',model:'A'}}) : undefined;
  const lead=handle?.agent ?? await ctx.agentLoop.create(SessionId('lead'),{provider:'one',model:'A'});
  let seq=0;
  const dispatch=async(agent,name,args,{record=false,callSignal=signal}={})=>{
    const batch=await ctx.tools.execute({agent,signal:callSignal,...(record?{log:{turn:0,step:0}}:{}),calls:[{type:'tool-call',id:'call-'+(++seq),name,arguments:JSON.stringify(args)}]});
    return batch.results[0].result;
  };
  const call=async(agent,name,args,opts)=>{const result=await dispatch(agent,name,args,opts);assert.equal(result.isError,false,JSON.stringify(result));return result.value;};
  const spawn=async(args={})=>{await call(lead,args.fork?'subagent_fork':'subagent',{name:args.name??'worker',description:'Integration test',prompt:'First task',...args,fork:undefined});const id=await ctx.subagents.resolveName(lead,args.name??'worker',signal);return {id,agent:ctx.agents.get(id)};};
  return {ctx,lead,adapter,root,fiber,dispatch,call,spawn};
}
