const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {stripTypeScriptTypes}=require('node:module');
let handler;
const state={auth:true,key:'test-only-key',quota:false,reserves:0,provider:0,uploads:0,failed:0};
const admin={auth:{getUser:async()=>({data:{user:state.auth?{id:'a',email:'a@shopee.com'}:null},error:null})},from:()=>{const query={select:()=>query,ilike:()=>query,maybeSingle:async()=>({data:{active:true}}),update:row=>{if(row.status==='failed')state.failed++;return query},eq:()=>query,then:resolve=>resolve({error:null})};return query;},rpc:async()=>{state.reserves++;return state.quota?{error:{message:'MASCOT_LIMIT'}}:{data:'job-a'};},storage:{from:()=>({upload:async()=>{state.uploads++;return {error:null}},remove:async()=>({error:null})})}};
const png=new Uint8Array(24);png.set([137,80,78,71]);new DataView(png.buffer).setUint32(16,1024);new DataView(png.buffer).setUint32(20,1536);
const source=fs.readFileSync(path.join(__dirname,'../supabase/functions/mascot-create/index.ts'),'utf8').replace(/^import .*;\r?\n/,'');
vm.runInNewContext(stripTypeScriptTypes(source),{createClient:()=>admin,Deno:{env:{get:key=>key==='OPENAI_API_KEY'?state.key:'mock'},serve:fn=>handler=fn},Request,Response,File,FormData,Uint8Array,DataView,AbortSignal,atob,console,fetch:async(url,options)=>{state.provider++;assert.match(url,/api.openai.com\/v1\/images\/(generations|edits)$/);if(state.providerFail)return new Response('{}',{status:500});return Response.json({data:[{b64_json:Buffer.from(png).toString('base64')}]});}});
function request(fields={},headers={Authorization:'Bearer valid'}){const form=new FormData();for(const [key,value]of Object.entries({name:'Test',description:'An otter',style:'chibi',...fields}))form.set(key,value);return new Request('https://local',{method:'POST',headers,body:form});}
(async()=>{
 assert.equal((await handler(request({},{}))).status,401);
 state.auth=false;assert.equal((await handler(request())).status,401);state.auth=true;
 state.key='';assert.equal((await handler(request())).status,503);state.key='test-only-key';
 assert.equal((await handler(request({name:''}))).status,400);
 assert.equal((await handler(request({description:'',photo:''}))).status,400);
 assert.equal(state.reserves,0);
 state.quota=true;assert.equal((await handler(request())).status,429);assert.equal(state.provider,0);state.quota=false;
 assert.equal((await handler(request())).status,200);assert.equal(state.uploads,1);
 state.providerFail=true;assert.equal((await handler(request())).status,502);assert.equal(state.failed,1);
 console.log('PASS: TypeScript parsing, auth, missing secret, invalid input, quota before paid request, stored success, provider failure cleanup');
})().catch(error=>{console.error(error);process.exitCode=1});
