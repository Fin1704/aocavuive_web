// DOM integration tests: real React components, simulated browser APIs (not visual/FPS proof).
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url:'http://localhost/', pretendToBeVisual:true })
for (const key of ['window','document','HTMLElement','HTMLCanvasElement','Event','KeyboardEvent']) global[key] = dom.window[key]
global.IS_REACT_ACT_ENVIRONMENT = true
const React = require('react')
const { act } = React
const { createRoot } = require('react-dom/client')
require.extensions['.css'] = () => {}
require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions:{ module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX, esModuleInterop:true } }).outputText, filename)
require.extensions['.ts'] = require.extensions['.tsx']

let reduced = false, images = [], observers = [], canceledFrames = 0
window.matchMedia = query => ({ matches:query.includes('reduced-motion') ? reduced : false, addEventListener(){}, removeEventListener(){} })
global.Image = class { constructor() { this.complete=false; this.naturalWidth=0; images.push(this) } }
global.ResizeObserver = class { constructor(callback) { this.callback=callback; this.disconnected=false; observers.push(this) } observe() {} disconnect() { this.disconnected=true } }
global.requestAnimationFrame = callback => setTimeout(()=>callback(performance.now()),2)
global.cancelAnimationFrame = id => { clearTimeout(id); if(id) canceledFrames++ }
HTMLElement.prototype.getClientRects = function() { return [this.getBoundingClientRect()] }
HTMLCanvasElement.prototype.getBoundingClientRect = () => ({x:0,y:0,left:0,top:0,width:800,height:500,right:800,bottom:500})
HTMLCanvasElement.prototype.setPointerCapture = function(id) { this.pointer=id }
HTMLCanvasElement.prototype.hasPointerCapture = function(id) { return this.pointer===id }
HTMLCanvasElement.prototype.releasePointerCapture = function() { this.pointer=null }
let canvasDraws = 0
HTMLCanvasElement.prototype.getContext = type => type === 'webgl' ? null : ({setTransform(){},drawImage(){canvasDraws++},clearRect(){},fillRect(){},beginPath(){},ellipse(){},arc(){},fill(){},stroke(){},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})})
const introPath = path.resolve(__dirname,'../src/components/OceanIntro/index.tsx')
const host=document.getElementById('root')
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const findButton=text=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes(text) || b.getAttribute('aria-label')?.includes(text))
function freshIntro() { delete require.cache[introPath]; return require(introPath).default }
async function mountIntro({clear=true}={}) {
 if(clear) window.sessionStorage.clear()
 images=[]; observers=[]
 const Intro=freshIntro(); const root=createRoot(host)
 await act(async()=>root.render(React.createElement(Intro,null,React.createElement('main',{tabIndex:-1},'Existing home content'))))
 return root
}
async function loaded(ok=true) {
 await act(async()=> { const image=images.at(-1); if(ok) { image.naturalWidth=1600; image.onload?.() } else image.onerror?.() })
}
async function click(text) { await act(async()=>findButton(text).click()) }
function pointer(canvas,type,x,y) {
 const event=new Event(type,{bubbles:true})
 for(const [key,value] of Object.entries({pointerId:1,isPrimary:true,button:0,clientX:x,clientY:y})) Object.defineProperty(event,key,{value})
 canvas.dispatchEvent(event)
}

test('OceanIntro DOM integration', async t => {
 await t.test('effects and native fish run without clicks even with reduced-motion OS setting; unmount stops drawing', async()=> {
  reduced=true
  const root=await mountIntro(); await loaded()
  assert.equal(document.querySelector('.ocean-reduced'),null)
  assert.equal(document.querySelectorAll('[aria-pressed]').length,0)
  assert.deepEqual(Array.from(document.querySelectorAll('[data-fish]'),node=>node.dataset.fish),['thulu','hecory','bongbong'])
  const before=canvasDraws
  await act(async()=>sleep(150))
  assert.ok(canvasDraws>before,'Idle water must animate without interaction')
  await act(async()=>root.unmount())
  const stopped=canvasDraws
  await sleep(100)
  assert.equal(canvasDraws,stopped,'Unmount must cancel animation work')
 })

 await t.test('preview URL bypasses completed session; welcome uses image button and replay resets wipe', async()=> {
  reduced=true
  window.sessionStorage.setItem('aocavuive:ocean-intro:v1','1')
  window.history.replaceState({},'', '/?intro=1')
  const root=await mountIntro({clear:false})
  try {
   assert.equal(document.querySelector('[role=dialog]').dataset.stage,'loading')
   await loaded(); await click('Mở đại dương'); await act(async()=>sleep(1250))
   assert.equal(document.querySelector('[role=dialog]').dataset.stage,'welcome')
   assert.match(findButton('Khám phá Ao Cá').querySelector('img').src,/start-button.webp/)
   assert.equal(document.querySelector('.ocean-welcome h1'),null)
   await click('Xem lại mở đầu')
   assert.equal(document.querySelector('[role=dialog]').dataset.stage,'wiping')
   assert.match(document.activeElement.getAttribute('aria-label'),/Mở đại dương/)
  } finally {
   await act(async()=>root.unmount())
   window.history.replaceState({},'', '/')
  }
 })

 await t.test('pointer wipe reveals scene, repeated enter is safe, focus and inert restore after completion', async()=> {
  reduced=false
  const root=await mountIntro()
  assert.equal(document.querySelector('[role=dialog]').dataset.stage,'loading')
  assert.equal(document.querySelector('main').parentElement.hasAttribute('inert'),true)
  await loaded()
  assert.match(document.activeElement.getAttribute('aria-label'),/Mở đại dương/)
  const canvas=document.querySelector('.ocean-veil')
  await act(async()=>pointer(canvas,'pointerdown',40,120))
  for(const [x,y] of [[40,120],[400,120],[760,120],[760,230],[400,230],[40,230]]) {
   await act(async()=> { pointer(canvas,'pointermove',x,y); await sleep(30) })
  }
  assert.equal(document.querySelector('[role=dialog]').dataset.stage,'revealing')
  await act(async()=>sleep(1250))
  assert.equal(document.querySelector('[role=dialog]').dataset.stage,'welcome')
  assert.match(document.activeElement.getAttribute('aria-label'),/Khám phá Ao Cá/)
  await act(async()=>{findButton('Khám phá Ao Cá').click();findButton('Khám phá Ao Cá').click()})
  await act(async()=>sleep(1850))
  assert.equal(document.querySelector('[role=dialog]'),null)
  assert.equal(document.querySelector('main').parentElement.hasAttribute('inert'),false)
  assert.equal(document.activeElement.tagName,'MAIN')
  assert.equal(window.sessionStorage.getItem('aocavuive:ocean-intro:v1'),'1')
  assert.ok(observers.every(observer=>observer.disconnected))
  await act(async()=>root.unmount())
 })

 await t.test('stored session suppresses intro on a fresh component instance (reload)', async()=> {
  const root=await mountIntro({clear:false})
  assert.equal(document.querySelector('[role=dialog]'),null)
  assert.equal(images.length,0)
  await act(async()=>root.unmount())
 })

 await t.test('failed image still supports keyboard reveal, focus trap and Escape', async()=> {
  reduced=true
  const root=await mountIntro(); await loaded(false)
  assert.equal(document.querySelector('.ocean-background'),null)
  await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true})))
  assert.match(document.activeElement.getAttribute('aria-label'),/Bỏ qua/)
  await click('Mở đại dương')
  await act(async()=>sleep(1250))
  assert.equal(document.querySelector('[role=dialog]').dataset.stage,'welcome')
  assert.equal(document.querySelector('.ocean-reduced'),null)
  await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})))
  assert.equal(document.querySelector('[role=dialog]'),null)
  assert.equal(document.body.style.overflow,'')
  await act(async()=>root.unmount())
 })

 await t.test('stalled asset falls back at deadline, then skip completes', async()=> {
  const root=await mountIntro()
  await act(async()=>sleep(3050))
  assert.equal(document.querySelector('[role=dialog]').dataset.stage,'wiping')
  assert.equal(document.querySelector('.ocean-background'),null)
  await click('Bỏ qua')
  assert.equal(document.querySelector('[role=dialog]'),null)
  await act(async()=>root.unmount())
 })

 await t.test('unmount during load clears callbacks and restores body; pending transition never marks session', async()=> {
  const root=await mountIntro(); const image=images.at(-1)
  await act(async()=>root.unmount())
  assert.equal(image.onload,null); assert.equal(image.onerror,null)
  assert.equal(document.body.style.overflow,'')
  const second=await mountIntro(); await loaded(); await click('Mở đại dương')
  await act(async()=>sleep(1250)); await click('Khám phá Ao Cá')
  await act(async()=>second.unmount())
  await sleep(230)
  assert.equal(window.sessionStorage.getItem('aocavuive:ocean-intro:v1'),null)
 })

 await t.test('hidden tab pauses transition and cancels canvas work; foreground resumes', async()=> {
  const root=await mountIntro(); await loaded()
  const canvas=document.querySelector('.ocean-veil')
  const before=canceledFrames
  await act(async()=> {
   pointer(canvas,'pointerdown',30,30)
   Object.defineProperty(document,'hidden',{configurable:true,value:true})
   document.dispatchEvent(new Event('visibilitychange'))
  })
  assert.ok(canceledFrames>before)
  assert.ok(document.querySelector('.ocean-hidden'))
  await click('Mở đại dương'); await act(async()=>sleep(220))
  assert.equal(document.querySelector('[role=dialog]').dataset.stage,'revealing')
  await act(async()=> { Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange')) })
  await act(async()=>sleep(1250))
  assert.equal(document.querySelector('[role=dialog]').dataset.stage,'welcome')
  await act(async()=>root.unmount())
 })

 await t.test('blocked sessionStorage still permits full animated entry', async()=> {
  window.sessionStorage.clear()
  const descriptor=Object.getOwnPropertyDescriptor(window,'sessionStorage')
  Object.defineProperty(window,'sessionStorage',{configurable:true,get(){throw new Error('Storage blocked')}})
  try {
   const root=await mountIntro({clear:false}); await loaded(); await click('Mở đại dương')
   await act(async()=>sleep(1250)); await click('Khám phá Ao Cá'); await act(async()=>sleep(1850))
   assert.equal(document.querySelector('[role=dialog]'),null)
   await act(async()=>root.unmount())
  } finally { Object.defineProperty(window,'sessionStorage',descriptor) }
 })

 await t.test('layout activates only on home; login and admin routes retain content without intro', async()=> {
  const Module=require('node:module'); const original=Module._load
  let route='/'
  Module._load=function(request,parent,isMain) {
   if(request==='next/navigation') return {usePathname:()=>route}
   if(request==='@/components/OceanIntro') return {__esModule:true,default:freshIntro()}
   if(request==='@/components/UserActivity') return {__esModule:true,default:()=>null}
   if(request==='../components/Header') return {__esModule:true,default:()=>React.createElement('header',null,'Header')}
   if(request==='../components/Sidebar') return {__esModule:true,default:()=>React.createElement('aside',null,'Sidebar')}
   return original.call(this,request,parent,isMain)
  }
  let Layout
  try { Layout=require('../src/layouts/Default/index.tsx').default } finally {Module._load=original}
  const root=createRoot(host)
  window.sessionStorage.clear()
  for(const pathname of ['/login','/register','/admin/users','/']) {
   route=pathname
   await act(async()=>root.render(React.createElement(Layout,null,React.createElement('div',null,'Route content'))))
   assert.equal(!!document.querySelector('[role=dialog]'),pathname==='/')
   assert.ok(host.textContent.includes('Route content'))
  }
  route='/admin/users'
  await act(async()=>root.render(React.createElement(Layout,null,'Admin users')))
  assert.equal(document.querySelector('[role=dialog]'),null)
  assert.equal(document.body.style.overflow,'')
  await act(async()=>root.unmount())
 })
})
