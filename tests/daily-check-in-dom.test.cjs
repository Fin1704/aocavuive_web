const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const Module = require('node:module')
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<div id="root"></div>', { url:'http://localhost/', pretendToBeVisual:true })
for (const key of ['window','document','HTMLElement','Event','StorageEvent']) global[key] = dom.window[key]
global.localStorage = dom.window.localStorage
global.IS_REACT_ACT_ENVIRONMENT = true
const React = require('react')
const { act } = React
const { createRoot } = require('react-dom/client')
require.extensions['.css'] = () => {}
require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions:{ module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX, esModuleInterop:true } }).outputText, filename)
const initial = {
 shells:12, streak:2, best_streak:5, last_checkin_date:'2026-09-28', checked_in_today:false, today_reward:null,
 date:'2026-09-29', timezone:'Asia/Ho_Chi_Minh', server_time:'2026-09-29T10:00:00+07:00', next_reset_at:'2026-09-30T00:00:00+07:00', reward_min:1,reward_max:3,
 recent_checkins:[{checkin_date:'2026-09-28',reward:2,streak:2}],
}
let gets, posts, request, getImpl, claimImpl
const api = {
 getCheckIn:signal=>{ gets++; return getImpl(signal) },
 claimCheckIn:signal=>{ posts++; return claimImpl(signal) },
 accountRequest:(...args)=>request(...args),
}
const originalLoad = Module._load
Module._load = function(name,...args) { return name === '@/services/checkInService' ? api : originalLoad.call(this,name,...args) }
const DailyCheckIn = require('../src/components/DailyCheckIn/index.tsx').default
const UserActivity = require('../src/components/UserActivity.tsx').default
Module._load = originalLoad
const host = document.getElementById('root')
const button = () => document.querySelector('.check-in-claim')
async function mount() {
 gets=0;posts=0; getImpl=async()=>structuredClone(initial)
 const root=createRoot(host)
 await act(async()=>root.render(React.createElement(DailyCheckIn,{userId:'fisher'})))
 return root
}

test('daily check-in UI states, concurrency and cleanup', async t=>{
 await t.test('loads actual balance and history; double click submits once and celebrates only a new award',async()=>{
  const root=await mount()
  assert.equal(document.querySelector('.check-in-wallet strong').textContent,'12')
  assert.equal(document.querySelectorAll('.check-in-days li').length,7)
  assert.equal(document.querySelectorAll('.is-collected').length,1)
  assert.equal(document.querySelector('.check-in-combo').textContent.trim(),'2 ngày')
  let resolve
  claimImpl=()=>new Promise(done=>resolve=done)
  await act(async()=>{button().click();button().click()})
  assert.equal(posts,1);assert.equal(button().disabled,true)
  await act(async()=>resolve({...initial,claimed:true,shells:15,streak:3,checked_in_today:true,today_reward:3}))
  assert.equal(document.querySelector('.check-in-wallet strong').textContent,'15')
  assert.match(document.querySelector('.check-in-reward').textContent,/\+3 Sò/)
  assert.equal(button().disabled,true)
  assert.match(localStorage.getItem('aocavuive:checkin-updated'),/fisher/)
  await act(async()=>root.unmount())
 })
 await t.test('lost response permits retry; already-claimed response does not award twice',async()=>{
  const root=await mount()
  claimImpl=async()=>{throw new Error('Mất kết nối')}
  await act(async()=>button().click())
  assert.equal(document.querySelector('.check-in-wallet strong').textContent,'12')
  assert.match(document.querySelector('[role=alert]').textContent,/Mất kết nối/)
  assert.equal(button().disabled,false)
  claimImpl=async()=>({...initial,claimed:false,shells:14,streak:3,checked_in_today:true,today_reward:2})
  await act(async()=>button().click())
  assert.equal(document.querySelector('.check-in-wallet strong').textContent,'14')
  assert.equal(document.querySelector('.check-in-reward'),null)
  assert.match(document.querySelector('.check-in-feedback').textContent,/đã nhận 2 Sò/)
  await act(async()=>root.unmount())
 })
 await t.test('cross-tab update refreshes state, unmount aborts pending claim and removes listeners',async()=>{
  const root=await mount()
  getImpl=async()=>({...initial,shells:13,checked_in_today:true,today_reward:1})
  await act(async()=>window.dispatchEvent(new StorageEvent('storage',{key:'aocavuive:checkin-updated'})))
  assert.equal(document.querySelector('.check-in-wallet strong').textContent,'13')
  getImpl=async()=>initial
  await act(async()=>window.dispatchEvent(new Event('focus')))
  let pendingSignal,finish
  claimImpl=signal=>{pendingSignal=signal;return new Promise(resolve=>finish=resolve)}
  await act(async()=>button().click())
  await act(async()=>root.unmount())
  assert.equal(pendingSignal.aborted,true)
  const before=gets
  await act(async()=>{window.dispatchEvent(new Event('focus'));finish({...initial,claimed:true,today_reward:3})})
  assert.equal(gets,before)
  assert.equal(host.innerHTML,'')
 })
 await t.test('visible heartbeat pauses while hidden and aborts on cleanup',async()=>{
  localStorage.setItem('access_token','test-only')
  let calls=0,signal
  request=async(path,method,s)=>{assert.equal(path,'/account/activity');assert.equal(method,'POST');calls++;signal=s}
  const root=createRoot(host)
  await act(async()=>root.render(React.createElement(UserActivity)))
  assert.equal(calls,1)
  Object.defineProperty(document,'hidden',{configurable:true,value:true})
  await act(async()=>document.dispatchEvent(new Event('visibilitychange')))
  assert.equal(calls,1)
  request=(path,method,s)=>{calls++;signal=s;return new Promise(()=>{})}
  Object.defineProperty(document,'hidden',{configurable:true,value:false})
  await act(async()=>document.dispatchEvent(new Event('visibilitychange')))
  assert.equal(calls,2)
  await act(async()=>root.unmount())
  assert.equal(signal.aborted,true)
  localStorage.clear()
 })
})
