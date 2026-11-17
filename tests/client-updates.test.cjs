const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const ts=require('typescript')
const Module=require('node:module')
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,filename)
global.localStorage={getItem:()=> 'admin-token'}
const original=Module._load
Module._load=function(name,...args){return name==='@/config/api'?{getApiUrl:p=>p}:original.call(this,name,...args)}
const service=require('../src/services/clientUpdateService.ts')
Module._load=original
const snapshot={platform:'Windows',current:{id:'current'},history:[],max_upload_bytes:1024}
test('authenticated current selection and rollback send expected pointer, not a version',async()=>{
 const calls=[]
 global.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({status:'success',data:snapshot}))}
 assert.deepEqual(await service.loadClientUpdates('Windows'),snapshot)
 await service.changeClientUpdate('Windows','backup','activate','current')
 await service.changeClientUpdate('Windows','backup','delete','current')
 assert.equal(calls[0].options.cache,'no-store')
 assert.equal(calls[0].options.headers.Authorization,'Bearer admin-token')
 assert.equal(calls[1].url,'/admin/client-updates/Windows/backup/activate')
 assert.deepEqual(JSON.parse(calls[1].options.body),{expected_current_id:'current'})
 assert.equal(calls[2].options.method,'DELETE')
 global.fetch=async()=>new Response(JSON.stringify({status:'error',message:'Selection changed'}),{status:409})
 await assert.rejects(service.changeClientUpdate('Windows','backup','activate','current'),/Selection changed/)
})
test('multipart upload reports progress, keeps filename and does not force content type',async()=>{
 let xhr
 global.XMLHttpRequest=class {
  constructor(){xhr=this;this.upload={};this.headers={}}
  open(method,url){this.method=method;this.url=url}
  setRequestHeader(key,value){this.headers[key]=value}
  send(data){this.data=data}
  abort(){this.onabort()}
 }
 const controller=new AbortController(),progress=[]
 const promise=service.uploadClientUpdate('iOS',new File(['zip'],'upload.zip'),'Backup','current',v=>progress.push(v),controller.signal)
 assert.equal(xhr.headers.Authorization,'Bearer admin-token');assert.equal(xhr.headers['Content-Type'],undefined)
 assert.equal(xhr.data.get('file').name,'upload.zip');assert.equal(xhr.data.get('expected_current_id'),'current')
 xhr.upload.onprogress({lengthComputable:true,loaded:5,total:10})
 xhr.status=200;xhr.responseText=JSON.stringify({status:'success',data:snapshot});xhr.onload()
 assert.deepEqual(await promise,snapshot);assert.deepEqual(progress,[50])
 const aborted=service.uploadClientUpdate('Windows',new File(['zip'],'upload.zip'),'','',()=>{},controller.signal)
 controller.abort();await assert.rejects(aborted,{name:'AbortError'})
})
