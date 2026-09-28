const { test } = require('node:test')
const assert = require('node:assert/strict')
const { transition, createSession, SESSION_KEY, rasterSize, coverCircle, REVEAL_COVERAGE, waitForImage } = require('../src/components/OceanIntro/model.ts')

test('complete intro sequence; repeated clicks and late events cannot restart it', () => {
 let stage = 'checking'
 for (const [event, expected] of [['NEW_SESSION','loading'], ['ASSETS_READY','wiping'], ['REVEAL','revealing'], ['REVEAL','revealing'], ['REVEALED','welcome'], ['ENTER','entering'], ['ENTER','entering'], ['ENTERED','done'], ['ASSETS_READY','done'], ['REVEALED','done'], ['NEW_SESSION','done']]) {
  stage = transition(stage, event)
  assert.equal(stage, expected)
 }
})

test('skip works at every stage and cannot be undone by delayed callbacks', () => {
 for (const stage of ['checking','loading','wiping','revealing','welcome','entering']) {
  const skipped = transition(stage, 'SKIP')
  assert.equal(skipped, 'done')
  for (const event of ['NEW_SESSION','ASSETS_READY','REVEALED','ENTERED']) assert.equal(transition(skipped,event),'done')
 }
 assert.equal(transition('checking', 'SEEN_SESSION'), 'done')
})

test('completion persists across page instances in the same storage and not a fresh tab', () => {
 const data = new Map()
 const storage = { getItem: key => data.get(key) ?? null, setItem: (key,value) => data.set(key,value) }
 const first = createSession(() => storage)
 assert.equal(first.hasSeen(), false)
 first.complete()
 assert.equal(data.get(SESSION_KEY), '1')
 assert.equal(createSession(() => storage).hasSeen(), true)
 assert.equal(createSession(() => ({getItem: () => null, setItem() {}})).hasSeen(), false)
})

test('denied storage access or quota does not prevent completion', () => {
 const blocked = createSession(() => { throw new Error('SecurityError') })
 assert.equal(blocked.hasSeen(),false)
 blocked.complete()
 assert.equal(blocked.hasSeen(),true)
 const quota = createSession(() => ({getItem: () => null, setItem() { throw new Error('QuotaExceededError') }}))
 quota.complete()
 assert.equal(quota.hasSeen(),true)
})

test('retina mobile and 4K canvas allocation stays bounded', () => {
 for (const [w,h,dpr] of [[3840,2160,2],[390,844,3],[2560,1440,1],[844,390,3]]) {
  const size = rasterSize(w,h,dpr)
  assert.ok(size.width <= 1280 && size.height <= 1280)
  assert.ok(size.width * size.height <= 921600)
 }
})

test('coverage counts distinct wiped area; repeated rubs cannot falsely unlock', () => {
 const grid = new Uint8Array(4000)
 const initial = coverCircle(grid,100,100,50,800,500)
 for (let i=0;i<100;i++) assert.equal(coverCircle(grid,100,100,50,800,500),initial)
 assert.ok(initial < REVEAL_COVERAGE)
 let coverage = initial
 for(let y=50;y<500;y+=70) for(let x=50;x<800;x+=70) coverage=coverCircle(grid,x,y,60,800,500)
 assert.ok(coverage > REVEAL_COVERAGE)
})

function fakeImage(overrides = {}) { return { complete:false, naturalWidth:0, onload:null, onerror:null, src:'', ...overrides } }

test('image success and cached image resolve once and clear listeners', () => {
 const image = fakeImage(); const values=[]
 waitForImage(image,'reef.webp',value=>values.push(value))
 const lateError=image.onerror
 image.naturalWidth=1600; image.onload()
 lateError()
 assert.deepEqual(values,[true]); assert.equal(image.onload,null); assert.equal(image.onerror,null)
 waitForImage(fakeImage({complete:true,naturalWidth:100}),'cached.webp',value=>values.push(value))
 assert.deepEqual(values,[true,true])
})

test('image error or timeout unlocks fallback without waiting on network', async () => {
 const image=fakeImage(); const values=[]
 waitForImage(image,'broken.webp',value=>values.push(value)); image.onerror()
 assert.deepEqual(values,[false])
 const stalled=fakeImage()
 waitForImage(stalled,'slow.webp',value=>values.push(value),10)
 await new Promise(resolve=>setTimeout(resolve,30))
 assert.deepEqual(values,[false,false]); assert.equal(stalled.onload,null)
})

test('unmount disposes image timer and rejects callbacks already queued', async () => {
 const image=fakeImage(); let calls=0
 const dispose=waitForImage(image,'slow.webp',()=>calls++,10)
 const queued=image.onload
 dispose(); queued()
 await new Promise(resolve=>setTimeout(resolve,30))
 assert.equal(calls,0); assert.equal(image.onerror,null)
})
