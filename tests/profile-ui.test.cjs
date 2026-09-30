const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const Module = require('node:module')
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'HTMLElement', 'Event', 'StorageEvent', 'localStorage']) global[key] = dom.window[key]
global.IS_REACT_ACT_ENVIRONMENT = true
const React = require('react')
const { act } = React
const { createRoot } = require('react-dom/client')
for (const extension of ['.tsx', '.ts']) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename)
const original = Module._load
let profile = { id: 'one', account: { gold: 1234, shells: 8 } }
Module._load = function(name, ...args) {
 if (name === '@/services/authService') return { getMe: async () => structuredClone(profile) }
 return original.call(this, name, ...args)
}
const Avatar = require('../src/components/UserAvatar.tsx').default
const Balances = require('../src/components/CurrencyBalances.tsx').default
const { useAuth } = require('../src/hooks/useAuth.ts')
Module._load = original
const host = document.getElementById('root')

test('avatar loads external URLs directly, resolves relative URLs, falls back and retries a new source', async () => {
 const root = createRoot(host)
 await act(async () => root.render(React.createElement(Avatar, { src: 'https://avatar.example/avatar.png', name: 'KiuPiu' })))
 assert.equal(host.querySelector('img').src, 'https://avatar.example/avatar.png')
 await act(async () => host.querySelector('img').dispatchEvent(new Event('error')))
 assert.equal(host.querySelector('img'), null)
 assert.equal(host.textContent, 'K')
 await act(async () => root.render(React.createElement(Avatar, { src: '/uploads/avatars/new.png', name: 'KiuPiu' })))
 assert.match(host.querySelector('img').src, /account\.aocavuive\.com\/uploads\/avatars\/new.png/)
 await act(async () => root.unmount())
})

test('profile balances refresh after same-tab and cross-tab check-in; unknown balances are not zero', async () => {
 localStorage.setItem('access_token', 'test')
 localStorage.setItem('auth_user', JSON.stringify(profile))
 function Profile() { const { user } = useAuth(); return React.createElement(Balances, { account: user?.account }) }
 const root = createRoot(host)
 await act(async () => root.render(React.createElement(Profile)))
 assert.match(host.textContent, /8 Sò/)
 assert.match(host.textContent, /1\.234 Vàng/)
 profile.account.shells = 11
 await act(async () => window.dispatchEvent(new Event('aocavuive:checkin-updated')))
 assert.match(host.textContent, /11 Sò/)
 profile.account.shells = 14
 await act(async () => window.dispatchEvent(new StorageEvent('storage', { key: 'aocavuive:checkin-updated' })))
 assert.match(host.textContent, /14 Sò/)
 await act(async () => root.render(React.createElement(Balances, {})))
 assert.match(host.textContent, /— Sò/)
 assert.match(host.textContent, /— Vàng/)
 await act(async () => root.unmount())
})
