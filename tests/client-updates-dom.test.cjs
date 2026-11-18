const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module')
const {JSDOM}=require('jsdom')
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/',pretendToBeVisual:true})
for(const key of ['window','document','HTMLElement','Event'])global[key]=dom.window[key]
global.IS_REACT_ACT_ENVIRONMENT=true
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client')
require.extensions['.tsx']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f)
const release=id=>({id,title:id,created_at:'2026-11-18T00:00:00Z',activated_at:'2026-11-18T00:00:00Z',release_hash:id,base_version:'0.1',engine:'4.7.2',mode:'code',bytes:100,pack_count:1,file_count:1})
const initial={platform:'Windows',current:release('Current'),history:[release('Backup')],max_upload_bytes:100000}
let changes=[],resolveChange,auth={mounted:true,isLoggedIn:true,isAdmin:true},redirects=[]
const api={loadClientUpdates:async platform=>({...structuredClone(initial),platform}),changeClientUpdate:(...args)=>{changes.push(args);return new Promise(done=>resolveChange=done)},uploadClientUpdate:()=>{throw Error('Unexpected upload')}}
const original=Module._load
Module._load=function(name,...args){
 if(name==='next/navigation')return {useRouter:()=>({replace:path=>redirects.push(path)})}
 if(name==='next/link')return {__esModule:true,default:({children,...props})=>React.createElement('a',props,children)}
 if(name==='@/hooks/useAuth')return {useAuth:()=>auth}
 if(name==='@/services/clientUpdateService')return api
 return original.call(this,name,...args)
}
const Page=require('../src/app/admin/client-updates/page.tsx').default
Module._load=original
const findButton=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(text))
test('admin UI pins current, restores history once, prevents deleting current and supports iOS',async()=>{
 window.confirm=()=>true
 const root=createRoot(document.getElementById('root'))
 await act(async()=>root.render(React.createElement(Page)))
 const current=document.querySelector('[aria-label="Bản hiện hành"]')
 assert.match(current.textContent,/Current/);assert.equal(current.querySelector('button'),null)
 assert.equal(document.querySelectorAll('input').length,2)
 assert.equal(document.querySelector('#release-file').accept,'.zip,application/zip')
 await act(async()=>{findButton('Đưa lên hiện hành').click();findButton('Đưa lên hiện hành').click()})
 assert.equal(changes.length,1);assert.deepEqual(changes[0].slice(0,4),['Windows','Backup','activate','Current'])
 assert.equal(findButton('iOS').disabled,true)
 await act(async()=>resolveChange({...initial,current:release('Backup'),history:[release('Current')]}))
 assert.match(current.textContent,/Backup/)
 await act(async()=>findButton('Xóa').click())
 assert.equal(changes[1][2],'delete');assert.equal(changes[1][3],'Backup')
 await act(async()=>resolveChange({...initial,current:release('Backup'),history:[]}))
 assert.match(document.querySelector('[aria-label="Lịch sử cập nhật"]').textContent,/Chưa có bản cũ/)
 await act(async()=>findButton('iOS').click())
 assert.match(document.querySelector('main').textContent,/Đang phát hành · iOS/)
 assert.doesNotMatch(document.querySelector('main').textContent,/iOS chỉ nhận gói tài nguyên/)
 await act(async()=>root.unmount())
 auth={mounted:true,isLoggedIn:true,isAdmin:false}
 const denied=createRoot(document.getElementById('root'))
 await act(async()=>denied.render(React.createElement(Page)))
 assert.equal(document.getElementById('root').textContent,'');assert.deepEqual(redirects,['/'])
 await act(async()=>denied.unmount())
})
