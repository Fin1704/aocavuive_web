'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Database, RefreshCw, Send, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { getAdminServers } from '@/services/serverService'
import type { GameServer } from '@/services/serverService'
import { getMasterdataStatus, publishMasterdata, registerMasterdataServer, syncMasterdataServer, validMasterdataCallback } from '@/services/masterdataService'
import type { MasterdataStatus, MasterdataTarget } from '@/services/masterdataService'

const button = 'inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50'
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Không thể kết nối Account.'

function stateOf(target: MasterdataTarget | undefined): { label: string; color: string } {
 if (!target) return { label: 'Chưa đăng ký', color: 'text-gray-400 bg-white/5' }
 if (!target.desired_revision) return { label: 'Chưa có bản phát hành', color: 'text-gray-400 bg-white/5' }
 if (target.applied_revision >= target.desired_revision) return { label: 'Đã áp dụng', color: 'text-emerald-300 bg-emerald-400/10' }
 if (target.last_error) return { label: 'Đang chờ thử lại', color: 'text-red-300 bg-red-400/10' }
 return { label: 'Đang chờ cập nhật', color: 'text-amber-300 bg-amber-400/10' }
}

function retryAt(value: string): string {
 const time = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`)
 return Number.isNaN(time.valueOf()) ? '' : time.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
}

export default function MasterdataPanel({ knownServers, disabled = false, onBusyChange }: { knownServers?: GameServer[]; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
 const [servers, setServers] = useState<GameServer[]>([])
 const [status, setStatus] = useState<MasterdataStatus | null>(null)
 const [refreshing, setRefreshing] = useState(false)
 const [error, setError] = useState('')
 const [notice, setNotice] = useState('')
 const [pending, setPending] = useState<string | null>(null)
 const [editing, setEditing] = useState<string | null>(null)
 const [callbackUrl, setCallbackUrl] = useState('')
 const [checkedAt, setCheckedAt] = useState('')
 const actionLock = useRef(false)
 const sequence = useRef(0)
 const alive = useRef(true)

 useEffect(() => { onBusyChange?.(pending !== null) }, [pending, onBusyChange])

 const load = useCallback(async (signal?: AbortSignal) => {
  const current = ++sequence.current
  setRefreshing(true)
  try {
   const [nextServers, nextStatus] = await Promise.all([knownServers ? Promise.resolve(knownServers) : getAdminServers(), getMasterdataStatus(signal)])
   if (signal?.aborted || !alive.current || current !== sequence.current) return
   setServers(nextServers); setStatus(nextStatus); setError('')
   setCheckedAt(new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }))
  } catch (error) {
   if (!signal?.aborted && alive.current && current === sequence.current) setError(errorText(error))
  } finally {
   if (!signal?.aborted && alive.current && current === sequence.current) setRefreshing(false)
  }
 }, [knownServers])

 useEffect(() => {
  alive.current = true
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout>
  const poll = async () => {
   if (document.visibilityState !== 'hidden') await load(controller.signal)
   if (!controller.signal.aborted) timer = setTimeout(() => void poll(), 10000)
  }
  void poll()
  return () => { alive.current = false; controller.abort(); clearTimeout(timer) }
 }, [load])

 async function act(key: string, action: () => Promise<string>) {
  if (actionLock.current) return
  actionLock.current = true; setPending(key); setError(''); setNotice('')
  try {
   const message = await action()
   if (!alive.current) return
   setNotice(message); toast.success(message)
   await load()
  } catch (error) {
   if (alive.current) { setError(errorText(error)); toast.error(errorText(error)) }
  } finally {
   actionLock.current = false
   if (alive.current) setPending(null)
  }
 }

 function publish() {
  void act('publish', async () => {
   const result = await publishMasterdata()
   return result.targets > 0
    ? `Đã phát hành phiên bản ${result.revision}, xếp hàng cập nhật cho ${result.targets} server. Theo dõi trạng thái áp dụng bên dưới.`
    : `Đã tạo phiên bản ${result.revision}. Chưa có server đăng ký nhận cập nhật.`
  })
 }

 function configure(server: GameServer, target?: MasterdataTarget) {
  setEditing(server.id); setCallbackUrl(target?.callback_url ?? ''); setNotice('')
 }

 function save(event: FormEvent) {
  event.preventDefault()
  const url = callbackUrl.trim()
  if (!editing || !validMasterdataCallback(url)) { setError('Nhập URL HTTPS kết thúc bằng /internal/masterdata/update, không có tài khoản, tham số hoặc #.'); return }
  const id = editing
  void act(`register:${id}`, async () => {
   await registerMasterdataServer(id, url)
   setEditing(null)
   return 'Đã lưu địa chỉ nhận cập nhật. Account sẽ gửi bản phát hành hiện hành nếu có.'
  })
 }

 const targets = new Map(status?.servers.map(target => [target.server_id, target]) ?? [])
 const registered = servers.filter(server => targets.has(server.id)).length
 const applied = servers.filter(server => { const target = targets.get(server.id); return !!target && target.desired_revision > 0 && target.applied_revision >= target.desired_revision }).length
 const busy = pending !== null || disabled

 return <section aria-label='Phát hành master data' className='mb-6 space-y-4 rounded-2xl border border-white/10 bg-[#1b2028] p-4 text-white sm:p-6'>
  <div className='flex flex-wrap items-start justify-between gap-4'>
   <div>
    <h2 className='flex items-center gap-2 text-lg font-semibold'><Database size={20} className='text-cyan-400' /> Cập nhật master cho server</h2>
    <p className='mt-1 max-w-3xl text-sm text-gray-400'>Lưu thay đổi trang phục, rồi phát hành để gửi toàn bộ master đến các server đã đăng ký. Gửi lại cho một server sẽ dùng bản đã phát hành, không gồm thay đổi chưa phát hành.</p>
   </div>
   <div className='flex flex-wrap gap-2'>
    <button type='button' className={button} disabled={refreshing || busy} onClick={() => void load()}><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Tải trạng thái</button>
    <button type='button' className={`${button} border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20`} disabled={busy || !status} onClick={publish}><Send size={16} /> {pending === 'publish' ? 'Đang phát hành…' : 'Phát hành master'}</button>
   </div>
  </div>
  {error && <p role='alert' className='rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200'>{error}{status && ' Dữ liệu bên dưới là trạng thái gần nhất đã tải được.'}</p>}
  {notice && <p role='status' className='rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-100'>{notice}</p>}
  <div className='flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-300'>
   <span>Bản phát hành: <strong className='text-white'>{status ? status.latest_revision || 'Chưa có' : 'Đang tải…'}</strong></span>
   <span>Đã đăng ký: <strong>{status ? registered : '—'}</strong></span>
   <span>Đã áp dụng: <strong>{status ? `${applied}/${registered}` : '—'}</strong></span>
   {checkedAt && <span className='text-gray-500'>Kiểm tra lúc {checkedAt} (giờ Việt Nam)</span>}
  </div>
  <p className='text-xs text-gray-400'>Trạng thái tự làm mới mỗi 10 giây khi mở trang. Xếp hàng thành công chưa có nghĩa server đã cập nhật xong.</p>
  {!status ? <p className='text-sm text-gray-400'>{error ? 'Chưa tải được trạng thái cập nhật.' : 'Đang tải các server nhận master…'}</p> : servers.length === 0 ? <p className='text-sm text-gray-400'>Chưa có server. Thêm server tại trang Quản lý Servers để cấu hình nhận master.</p> : <div className='overflow-x-auto'>
   <table className='w-full min-w-[720px] text-left text-sm'>
    <thead className='border-b border-white/10 text-gray-400'><tr><th scope='col' className='py-3 pr-4'>Server</th><th scope='col' className='py-3 pr-4'>Trạng thái master</th><th scope='col' className='py-3 pr-4'>Đã áp dụng / Mục tiêu</th><th scope='col' className='py-3 pr-4'>Địa chỉ nhận cập nhật</th><th scope='col' className='py-3'>Thao tác</th></tr></thead>
    <tbody>{servers.map(server => {
     const target = targets.get(server.id)
     const state = stateOf(target)
     return <tr key={server.id} className='border-b border-white/5 align-top'>
      <td className='py-3 pr-4'><p className='font-medium'>{server.name || (server.server_number ? `Server ${server.server_number}` : server.id)}</p><p className='mt-1 max-w-48 break-all text-xs text-gray-500'>{server.id}</p></td>
      <td className='py-3 pr-4'><span className={`inline-block rounded-full px-2 py-1 text-xs ${state.color}`}>{state.label}</span>{target?.last_error && target.applied_revision < target.desired_revision && <p className='mt-2 max-w-48 text-xs text-gray-400'>Chưa nhận xác nhận cập nhật. Đã thử {target.attempts} lần.{target.next_attempt_at && ` Lần tiếp theo: ${retryAt(target.next_attempt_at)}.`}</p>}</td>
      <td className='py-3 pr-4 tabular-nums'>{target ? `${target.applied_revision} / ${target.desired_revision}` : '—'}</td>
      <td className='max-w-72 break-all py-3 pr-4 text-xs text-gray-400'>{target?.callback_url || 'Chưa cấu hình'}</td>
      <td className='py-3'><div className='flex flex-wrap gap-2'><button type='button' className={button} disabled={busy} onClick={() => configure(server, target)} aria-label={`Cấu hình master cho ${server.name || server.id}`}><Settings2 size={14} /> Cấu hình</button><button type='button' className={button} disabled={busy || !target || !status.latest_revision} onClick={() => void act(`sync:${server.id}`, async () => { const result = await syncMasterdataServer(server.id); return `Đã xếp hàng gửi lại phiên bản ${result.revision} cho ${server.name || server.id}.` })}>{pending === `sync:${server.id}` ? 'Đang gửi…' : 'Gửi lại'}</button></div></td>
     </tr>
    })}</tbody>
   </table>
  </div>}
  {editing && <form onSubmit={save} className='space-y-3 rounded-xl border border-cyan-400/20 bg-[#13161b] p-4'>
   <label htmlFor='masterdata-callback' className='block text-sm font-medium'>Địa chỉ nhận master — {servers.find(server => server.id === editing)?.name || editing}</label>
   <input id='masterdata-callback' type='url' required maxLength={512} autoComplete='off' value={callbackUrl} disabled={busy} onChange={event => setCallbackUrl(event.target.value)} placeholder='https://game.example.com/internal/masterdata/update' className='w-full rounded-lg border border-white/15 bg-[#1b2028] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50' />
   <p className='text-xs text-gray-400'>Dùng địa chỉ HTTPS trỏ đến Game server. Khóa kết nối được cấu hình riêng trên Account và Game; không nhập khóa vào trình duyệt.</p>
   <div className='flex gap-2'><button type='submit' className={button} disabled={busy}>{pending === `register:${editing}` ? 'Đang lưu…' : 'Lưu và đồng bộ'}</button><button type='button' className={button} disabled={pending !== null} onClick={() => setEditing(null)}>Hủy</button></div>
  </form>}
 </section>
}
