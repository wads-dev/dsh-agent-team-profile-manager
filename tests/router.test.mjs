import test from 'node:test';
import assert from 'node:assert/strict';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { textResponse, toolCallResponse } from './adapter.mjs';
import { setup, until, signal } from './rc2-fixture.mjs';

test('native spawn chooses an authorized route and keeps standard tools available',async t=>{
 const f=await setup(t,[textResponse('chosen B')]);const child=await f.spawn({provider:'two',model:'B',reasoning_effort:'high'});
 await until(()=>f.adapter.requests.length===1);assert.equal(f.adapter.requests[0].model,'B');assert.equal(f.adapter.requests[0].reasoningEffort,'high');
 assert.ok(f.ctx.tools.get('subagent',f.lead));assert.ok(f.ctx.tools.get('subagent_fork',f.lead));assert.equal(await f.ctx.subagents.resolveName(f.lead,'worker',signal),child.id);
});

test('native fork also accepts an explicit authorized model',async t=>{
 const f=await setup(t,[textResponse('fork B')]);const child=await f.spawn({fork:true,provider:'two',model:'B'});
 await until(()=>f.adapter.requests.some(r=>r.sessionId===child.id));assert.equal(f.adapter.requests.find(r=>r.sessionId===child.id).model,'B');
});

test('self-switch changes actual next inference, retaining session and prior history',async t=>{
 const f=await setup(t,[toolCallResponse('switch','switch_model',{provider:'two',model:'B'}),textResponse('B after switch')]);
 const child=await f.spawn();await until(()=>f.adapter.requests.filter(r=>r.sessionId===child.id).length>=2);
 const requests=f.adapter.requests.filter(r=>r.sessionId===child.id);
 assert.deepEqual(requests.map(r=>r.model),['A','B']);assert.equal(requests[0].sessionId,child.id);assert.equal(requests[1].sessionId,child.id);
 assert.match(JSON.stringify(requests[1].messages),/First task/);
});

test('runtime root switch does not alter an admitted inference; following step uses B',async t=>{
 const f=await setup(t,['hang',textResponse('settled notice'),textResponse('new route'),textResponse('done notice')]);const child=await f.spawn();await until(()=>f.adapter.requests.length===1);
 const changed=await f.call(f.lead,'switch_teammate_model',{teammate:'worker',provider:'two',model:'B'});
 assert.equal(changed.next.model,'B');assert.equal(f.adapter.requests.length,1);assert.equal(f.adapter.requests[0].model,'A');
 child.agent.cancel({kind:'user'});await until(()=>child.agent.status==='idle');
 await f.ctx.subagents.sendMessage(f.lead,child.id,[{type:'text',text:'Continue'}],{signal});
 await until(()=>f.adapter.requests.filter(r=>r.sessionId===child.id).length===2);const requests=f.adapter.requests.filter(r=>r.sessionId===child.id);assert.equal(requests[1].model,'B');
});

test('invalid/unapproved routes and invalid effort never change selection',async t=>{
 const f=await setup(t,['hang']);const child=await f.spawn();await until(()=>f.adapter.requests.length===1);
 for(const args of [{provider:'two',model:'C'},{provider:'two',model:'B',reasoning_effort:'invalid'}]){
  const result=await f.dispatch(f.lead,'switch_teammate_model',{teammate:'worker',...args});assert.equal(result.isError,true);
 }
 assert.equal(child.agent.model.current().model,'A');
 const denied=await f.dispatch(f.lead,'switch_teammate_model',{teammate:'not-a-member',provider:'two',model:'B'});assert.equal(denied.isError,true);
});

test('Session without route opt-in rejects foreign creation and runtime routes',async t=>{
 const f=await setup(t,[],{authorized:false});
 const denied=await f.dispatch(f.lead,'subagent',{name:'denied',description:'No permission',prompt:'test',provider:'two',model:'B'});
 assert.equal(denied.isError,true);assert.equal(f.adapter.requests.length,0);
 const switched=await f.dispatch(f.lead,'switch_model',{provider:'two',model:'B'});assert.equal(switched.isError,true);assert.equal(f.lead.model.current().model,'A');
 const discovery=await f.call(f.lead,'list_models',{provider:'two',model:'B'});assert.deepEqual(discovery.routes,[]);
});

test('aliases are durable receipts, preserve targets, reset and reject child authority',async t=>{
 const f=await setup(t,['hang']);const child=await f.spawn();await until(()=>f.adapter.requests.length===1);
 const named=await f.call(f.lead,'set_teammate_display_name',{target:'worker',display_name:'Revisão Ágil'},{record:true});assert.equal(named.session,child.id);
 assert.equal(f.ctx.sessionProjections.snapshot(f.lead.session).values.agentTeamDisplayNames[child.id],'Revisão Ágil');
 assert.equal(await f.ctx.subagents.resolveName(f.lead,'worker',signal),child.id);
 const denied=await f.dispatch(child.agent,'set_teammate_display_name',{target:'lead',display_name:'Denied'},{record:true});assert.equal(denied.isError,true);
 const reset=await f.call(f.lead,'set_teammate_display_name',{target:'worker',display_name:null},{record:true});assert.equal(reset.display_name,'worker');assert.equal(f.ctx.sessionProjections.snapshot(f.lead.session).values.agentTeamDisplayNames[child.id],undefined);
});

test('runtime aliases and model route survive complete host restart',async t=>{
 const f=await setup(t,['hang',toolCallResponse('persist-alias','set_teammate_display_name',{target:'worker',display_name:'Persisted alias'}),textResponse('alias saved')]);const child=await f.spawn();await until(()=>f.adapter.requests.length===1);
 f.lead.followup(createUserMessage({content:[{type:'text',text:'Name worker'}],source:{kind:'user'}}));
 await f.lead.whenIdle();
 assert.equal(f.ctx.sessionProjections.snapshot(f.lead.session).values.agentTeamDisplayNames[child.id],'Persisted alias');
 await f.call(f.lead,'switch_teammate_model',{teammate:'worker',provider:'two',model:'B'});
 await f.ctx.sessions.flush(f.lead.session);await f.ctx.sessions.flush(child.agent.session);await f.ctx.fiber.dispose();
 const second=await setup(t,[textResponse('resumed history'),textResponse('settled notice')],{root:f.root,resume:true});
 assert.equal(second.ctx.sessionProjections.snapshot(second.lead.session).values.agentTeamDisplayNames[child.id],'Persisted alias');
 await second.ctx.subagents.sendMessage(second.lead,child.id,[{type:'text',text:'Resume same child'}],{signal});
 await until(()=>second.adapter.requests.length>=1);assert.equal(second.adapter.requests[0].model,'B');assert.equal(second.adapter.requests[0].sessionId,child.id);assert.match(JSON.stringify(second.adapter.requests[0].messages),/First task/);
});

test('idempotent switches do not duplicate events and default effort stays unpinned',async t=>{
 const f=await setup(t,['hang']);const child=await f.spawn();await until(()=>f.adapter.requests.length===1);
 const args={teammate:'worker',provider:'two',model:'B'};
 const first=await f.call(f.lead,'switch_teammate_model',args);assert.equal(first.changed,true);
 const count=child.agent.session.snapshotEvents().filter(e=>e.type==='model/selection').length;
 const second=await f.call(f.lead,'switch_teammate_model',args);assert.equal(second.changed,false);
 assert.equal(child.agent.session.snapshotEvents().filter(e=>e.type==='model/selection').length,count);
 assert.equal(child.agent.model.current().reasoningEffort,undefined);
 const controller=new AbortController();controller.abort();
 const aborted=await f.dispatch(f.lead,'switch_teammate_model',{teammate:'worker',provider:'one',model:'A'},{callSignal:controller.signal});assert.equal(aborted.isError,true);
 assert.equal(child.agent.model.current().model,'B');
});
