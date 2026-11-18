'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pin, UploadCloud, RotateCcw, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { changeClientUpdate, loadClientUpdates, uploadClientUpdate, type ClientPlatform, type ClientRelease, type ClientUpdates } from '@/services/clientUpdateService'

const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/10'
const bytes = (n: number) => `${(n / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} MB`
const date = (value: string) => new Date(value).toLocaleString('vi-VN')

function Details({ release }: { release: ClientRelease }) {
  return <><h3 className='break-words text-lg font-semibold'>{release.title}</h3>
    <p className='mt-2 text-sm text-white/65'>{bytes(release.bytes)} · {release.pack_count} gói · {release.file_count} tệp</p>
    <p className='mt-1 text-sm text-white/65'>Client {release.base_version} · Godot {release.engine} · {release.mode === 'content' ? 'Tài nguyên' : 'Tài nguyên, scene và script'}{release.signed ? ' · Đã ký RSA' : ''}</p>
    {release.active_for_target && <p className='mt-1 text-xs font-medium text-emerald-300'>Đang ghim cho nhánh Client {release.base_version} ({release.engine})</p>}
    <p className='mt-1 text-sm text-white/50'>Tải lên: {date(release.created_at)}</p>
  </>
}

export default function ClientUpdatesPage() {
  const router = useRouter()
  const { mounted, isLoggedIn, isAdmin } = useAuth()
  const [platform, setPlatform] = useState<ClientPlatform>('Windows')
  const [data, setData] = useState<ClientUpdates | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [reload, setReload] = useState(0)
  const lock = useRef(false)
  const operation = useRef<AbortController | null>(null)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { if (mounted && (!isLoggedIn || !isAdmin)) router.replace('/') }, [mounted, isLoggedIn, isAdmin, router])
  useEffect(() => () => operation.current?.abort(), [])
  useEffect(() => {
    if (!mounted || !isLoggedIn || !isAdmin) return
    const controller = new AbortController()
    setLoading(true); setData(null); setError(''); setNotice('')
    loadClientUpdates(platform, controller.signal).then(value => { if (!controller.signal.aborted) setData(value) })
      .catch(e => { if (!controller.signal.aborted) setError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [platform, mounted, isLoggedIn, isAdmin, reload])

  async function perform(action: (signal: AbortSignal) => Promise<ClientUpdates>, message: string) {
    if (lock.current) return
    lock.current = true; setBusy(true); setError(''); setNotice('')
    const controller = new AbortController(); operation.current = controller
    try {
      const result = await action(controller.signal)
      if (!controller.signal.aborted) { setData(result); setNotice(message) }
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Không thể thực hiện. Hãy tải lại danh sách.')
    } finally {
      lock.current = false
      if (!controller.signal.aborted) { setBusy(false); setProgress(null) }
    }
  }
  if (!mounted || !isLoggedIn || !isAdmin) return null
  return <main className='min-h-screen bg-[#13161b] px-4 py-8 text-white sm:px-8'><div className='mx-auto max-w-5xl'>
    <Link href='/admin' className={`${button} mb-6`}><ArrowLeft size={18} /> Quản trị</Link>
    <h1 className='text-2xl font-bold sm:text-3xl'>Cập nhật game</h1>
    <p className='mt-2 text-white/65'>Mỗi hệ điều hành có một bản đang phát hành. Có thể đưa bất kỳ bản lưu cũ nào lên lại.</p>
    <div className='my-6 flex flex-wrap gap-2' role='group' aria-label='Hệ điều hành'>
      {(['Windows', 'Android', 'iOS'] as ClientPlatform[]).map(os => <button key={os} type='button' disabled={busy} aria-pressed={platform === os}
        className={`${button} ${platform === os ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200' : ''}`}
        onClick={() => { setPlatform(os); setFile(null); setTitle(''); if (input.current) input.current.value = '' }}>{os}</button>)}
      <button type='button' disabled={busy || loading} onClick={() => setReload(v => v + 1)} className={`${button} sm:ml-auto`}><RefreshCw size={16} /> Tải lại</button>
    </div>
    {error && <p role='alert' className='mb-5 rounded-lg border border-red-400/40 bg-red-400/10 p-4'>{error}</p>}
    <p role='status' aria-live='polite' className='text-emerald-300'>{notice || (loading ? 'Đang tải danh sách…' : '')}</p>
    {data && <>
      <section aria-label='Bản hiện hành' className='mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/5 p-5 sm:p-6'>
        <p className='mb-3 flex items-center gap-2 font-medium text-emerald-300'><Pin size={18} /> Đang phát hành · {platform}</p>
        {data.current ? <><Details release={data.current} /><p className='mt-2 text-sm text-emerald-200/75'>Ghim lúc: {date(data.current.activated_at)}</p></> : <p className='text-white/60'>Chưa có bản cập nhật đang phát hành.</p>}
      </section>
      <section className='my-6 rounded-xl border border-white/15 p-5 sm:p-6'>
        <h2 className='text-xl font-semibold'>Tải lên bản mới</h2>
        <p className='mt-2 text-sm text-white/65'>Chọn upload.zip do plugin Godot tạo cho {platform}. Sau khi kiểm tra thành công, bản này được ghim cho nhánh phiên bản tương ứng; Windows, Android và iOS đều hỗ trợ cập nhật đầy đủ asset, scene và script.</p>
        <form className='mt-5 space-y-4' onSubmit={event => {
          event.preventDefault()
          if (!file || busy) return
          if (file.size > data.max_upload_bytes) { setError(`Tệp vượt giới hạn ${bytes(data.max_upload_bytes)}.`); return }
          void perform(async signal => {
            setProgress(0)
            const result = await uploadClientUpdate(platform, file, title, data.current?.id || '', setProgress, signal)
            if (!signal.aborted) { setFile(null); setTitle(''); if (input.current) input.current.value = '' }
            return result
          }, 'Đã tải lên và ghim bản cập nhật.')
        }}>
          <div><label htmlFor='release-title' className='mb-2 block text-sm'>Tên gợi nhớ (tùy chọn)</label><input id='release-title' maxLength={80} disabled={busy} value={title} onChange={e => setTitle(e.target.value)} placeholder='Ví dụ: Giao diện mùa đông'
            className='min-h-11 w-full rounded-lg border border-white/20 bg-white/5 px-3 focus:outline-cyan-400' /></div>
          <div><label htmlFor='release-file' className='mb-2 block text-sm'>Gói cập nhật ZIP</label><input ref={input} id='release-file' type='file' accept='.zip,application/zip' disabled={busy} onChange={e => setFile(e.target.files?.[0] || null)} className='min-h-11 w-full rounded-lg border border-white/20 p-2 file:mr-4 file:rounded file:border-0 file:bg-white/15 file:px-3 file:py-2 file:text-white' />
            <p className='mt-2 text-xs text-white/50'>Tối đa {bytes(data.max_upload_bytes)}; hosting có thể đặt giới hạn thấp hơn. Không cần nhập số phiên bản cập nhật.</p></div>
          <button type='submit' disabled={busy || !file} className={`${button} border-cyan-400/50 bg-cyan-400/10 text-cyan-200`}><UploadCloud size={18} />{busy && progress !== null ? 'Đang phát hành…' : 'Tải lên và phát hành'}</button>
          {progress !== null && <div role='status' aria-live='polite'><progress className='w-full accent-cyan-400' value={progress} max={100} aria-label='Tiến độ tải lên' /><p className='text-sm text-white/65'>{progress < 100 ? `Đã tải ${progress}%` : 'Đang kiểm tra và phát hành…'}</p></div>}
        </form>
      </section>
      <section aria-label='Lịch sử cập nhật'><h2 className='mb-4 text-xl font-semibold'>Bản cũ ({data.history.length})</h2>
        {!data.history.length && <p className='rounded-xl border border-white/15 p-5 text-white/60'>Chưa có bản cũ.</p>}
        <div className='space-y-3'>{data.history.map(release => <article key={release.id} className='rounded-xl border border-white/15 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6'>
          <div className='min-w-0'><Details release={release} /></div>
          <div className='mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0'>
            <button type='button' disabled={busy} className={button} onClick={() => {
              if (window.confirm(`Phát hành lại “${release.title}” cho ${platform}? Bản hiện hành sẽ chuyển xuống lịch sử.`)) void perform(signal => changeClientUpdate(platform, release.id, 'activate', data.current?.id || '', signal), 'Đã ghim bản được chọn.')
            }}><RotateCcw size={16} /> Đưa lên hiện hành</button>
            <button type='button' disabled={busy || Boolean(release.active_for_target)} title={release.active_for_target ? 'Không thể xóa bản đang phục vụ một nhánh Client khác' : undefined} className={`${button} text-red-300`} onClick={() => {
              if (window.confirm(`Xóa “${release.title}” khỏi lịch sử?`)) void perform(signal => changeClientUpdate(platform, release.id, 'delete', data.current?.id || '', signal), 'Đã xóa khỏi lịch sử.')
            }}><Trash2 size={16} /> Xóa</button>
          </div>
        </article>)}</div>
      </section>
    </>}
  </div></main>
}
