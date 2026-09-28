const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const Module = require('node:module')
const storage = new Map()
global.localStorage = { getItem:key=>storage.get(key)??null, setItem:(key,value)=>storage.set(key,String(value)) }
require.extensions['.ts'] = (module,filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename)
const load=Module._load
Module._load=function(name,...args) { return name==='@/config/api' ? {getApiUrl:path=>path} : load.call(this,name,...args) }
const {getCheckIn,claimCheckIn}=require('../src/services/checkInService.ts')
Module._load=load
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}})

test('expired requests share refresh and use new credentials; claim sends no client-selected award',async()=>{
 storage.clear();storage.set('access_token','old');storage.set('refresh_token','refresh-old')
 let refreshes=0,claims=0
 global.fetch=async(path,options)=>{
  if(path==='/auth/refresh') {refreshes++;await new Promise(resolve=>setTimeout(resolve,20));return json({data:{access_token:'new',refresh_token:'refresh-new'}})}
  if(options.headers.Authorization==='Bearer old')return json({},401)
  assert.equal(options.headers.Authorization,'Bearer new')
  assert.equal(options.body,undefined)
  assert.equal(options.cache,'no-store')
  if(options.method==='POST')claims++
  return json({data:{shells:3,claimed:true}})
 }
 const [status,claim]=await Promise.all([getCheckIn(new AbortController().signal),claimCheckIn(new AbortController().signal)])
 assert.equal(refreshes,1);assert.equal(claims,1);assert.equal(claim.shells,3);assert.equal(status.shells,3)
 assert.equal(storage.get('refresh_token'),'refresh-new')
})

test('aborting during refresh saves rotated credentials but never resends the claim',async()=>{
 storage.clear();storage.set('access_token','old');storage.set('refresh_token','refresh-old')
 const controller=new AbortController();let attempts=0
 global.fetch=async(path)=>{
  if(path==='/auth/refresh'){controller.abort();return json({data:{access_token:'new',refresh_token:'refresh-new'}})}
  attempts++;return json({},401)
 }
 await assert.rejects(claimCheckIn(controller.signal),{name:'AbortError'})
 assert.equal(attempts,1)
 assert.equal(storage.get('refresh_token'),'refresh-new')
})

test('missing credentials and server errors do not turn into successful rewards',async()=>{
 storage.clear();let calls=0
 global.fetch=async()=>{calls++;return json({message:'Unavailable'},503)}
 await assert.rejects(claimCheckIn(new AbortController().signal),/đăng nhập/)
 assert.equal(calls,0)
 storage.set('access_token','token')
 await assert.rejects(claimCheckIn(new AbortController().signal),/Unavailable/)
})
