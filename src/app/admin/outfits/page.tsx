'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Shirt } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createOutfit, getOutfitCatalog, getOutfits, getSkinImageUrl } from '@/services/outfitService'
import type { Outfit, OutfitCatalog } from '@/services/outfitService'

const field = 'mt-2 w-full rounded-xl border border-white/15 bg-[#13161b] px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-60'
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Không thể kết nối Account.'

export default function OutfitsPage() {
	const router = useRouter()
	const { mounted, isLoggedIn, isAdmin } = useAuth()
	const [catalog, setCatalog] = useState<OutfitCatalog | null>(null)
	const [outfits, setOutfits] = useState<Outfit[]>([])
	const [slot, setSlot] = useState('helmet')
	const [skin, setSkin] = useState('')
	const [color, setColor] = useState('#FFFFFF')
	const [search, setSearch] = useState('')
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const submitting = useRef(false)
	const [error, setError] = useState('')
	const [message, setMessage] = useState('')

	const load = useCallback(async (signal?: AbortSignal) => {
		setLoading(true)
		setError('')
		try {
			const [source, snapshot] = await Promise.all([getOutfitCatalog(signal), getOutfits(signal)])
			if (signal?.aborted) return
			setCatalog(source)
			setOutfits(snapshot.items)
		} catch (error) {
			if (!signal?.aborted) setError(errorText(error))
		} finally {
			if (!signal?.aborted) setLoading(false)
		}
	}, [])

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) { router.replace('/'); return }
		const controller = new AbortController()
		void load(controller.signal)
		return () => controller.abort()
	}, [mounted, isLoggedIn, isAdmin, router, load])

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (submitting.current || loading || !catalog) return
		setError(''); setMessage('')
		if (!catalog.items.some(item => item.slot_code === slot && item.skin_name === skin) || !/^#[0-9a-fA-F]{6}$/.test(color)) {
			setError('Chọn ID trang phục và màu hợp lệ.'); return
		}
		submitting.current = true
		setSaving(true)
		try {
			const created = await createOutfit({ type_id: 1, slot_code: slot, skin_name: skin, color_code: color.toUpperCase() })
			setOutfits(rows => [...rows.filter(row => row.detail_id !== created.detail_id), created])
			setMessage(`Đã tạo Item 1:${created.detail_id} — ${created.skin_name}.`)
		} catch (error) { setError(errorText(error)) }
		finally { submitting.current = false; setSaving(false) }
	}

	if (!mounted || !isLoggedIn || !isAdmin) return null
	const filtered = outfits.filter(item => `${item.detail_id} ${item.skin_name} ${item.color_code} ${catalog?.slots.find(s => s.code === item.slot_code)?.label}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.detail_id - a.detail_id)
	const skins = catalog?.items.filter(item => item.slot_code === slot) ?? []
	const selectedSkin = skins.find(item => item.skin_name === skin)

	return <main className='min-h-screen bg-[#13161b] p-4 text-white sm:p-8'>
		<div className='mx-auto max-w-7xl'>
			<Link href='/admin' className='mb-7 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white'><ArrowLeft size={16} /> Trang quản trị</Link>
			<div className='mb-8 flex flex-wrap items-center justify-between gap-4'>
				<div><h1 className='flex items-center gap-3 text-2xl font-bold'><Shirt className='text-cyan-400' /> Trang phục</h1><p className='mt-2 text-sm text-gray-400'>Quản lý mẫu trang phục và màu sắc cho nhân vật.</p></div>
				<button type='button' disabled={loading || saving} onClick={() => void load()} className='flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 disabled:opacity-50'><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Tải lại</button>
			</div>
			{error && <p role='alert' className='mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200'>{error}</p>}
			{message && <p role='status' className='mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200'>{message}</p>}
			<div className='grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]'>
				<section className='self-start rounded-2xl border border-white/10 bg-[#1b2028] p-6'>
					<h2 className='mb-6 text-lg font-semibold'>Thêm trang phục</h2>
					<form onSubmit={submit}>
						<fieldset disabled={loading || saving || !catalog} className='space-y-5 disabled:opacity-60'>
							<div><p className='text-sm font-medium'>ID Item</p><div className='mt-2 grid grid-cols-2 gap-3'>
								<label className='text-sm text-gray-400' htmlFor='type-id'>TypeID<input id='type-id' className={field} value='1' readOnly /></label>
								<label className='text-sm text-gray-400' htmlFor='detail-id'>DetailID<input id='detail-id' className={field} value='Tự động cấp' readOnly /></label>
							</div><p className='mt-2 text-xs text-gray-400'>DetailID tự tăng từ 1, hiển thị sau khi tạo.</p></div>
							<label className='block text-sm' htmlFor='outfit-slot'>Loại trang phục<select id='outfit-slot' className={field} value={slot} onChange={event => { setSlot(event.target.value); setSkin('') }} required>{catalog?.slots.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
							<label className='block text-sm' htmlFor='outfit-skin'>ID trang phục<select id='outfit-skin' className={field} value={skin} onChange={event => setSkin(event.target.value)} required><option value=''>Chọn trang phục</option>{skins.map(item => <option key={item.skin_name} value={item.skin_name}>{item.skin_name}</option>)}</select><span className='mt-2 block text-xs text-gray-400'>Tên skin gốc trong Spine · {skins.length} lựa chọn</span></label>
							<div className='rounded-xl border border-white/10 bg-[#13161b] p-3'>
								<p className='mb-3 text-xs text-gray-400'>Ảnh minh họa</p>
								<div className='flex min-h-28 items-center justify-center rounded-lg bg-[linear-gradient(45deg,#20252d_25%,transparent_25%,transparent_75%,#20252d_75%),linear-gradient(45deg,#20252d_25%,#171b21_25%,#171b21_75%,#20252d_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]'>
									{selectedSkin ? <img src={getSkinImageUrl(selectedSkin)} alt={`Minh họa ${selectedSkin.skin_name}`} className='max-h-32 max-w-full object-contain p-2' /> : <span className='text-sm text-gray-500'>Chọn một skin để xem</span>}
								</div>
							</div>
							<div><label htmlFor='outfit-color' className='text-sm'>Màu trang phục</label><div className='mt-2 flex items-center gap-3'><input id='outfit-color' type='color' value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#FFFFFF'} onChange={event => setColor(event.target.value.toUpperCase())} className='h-11 w-14 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1' /><input aria-label='Mã màu HEX' value={color} onChange={event => setColor(event.target.value.toUpperCase())} pattern='#[0-9a-fA-F]{6}' maxLength={7} required className={`${field} !mt-0 font-mono`} /></div></div>
							<button type='submit' className='w-full rounded-xl bg-cyan-400 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50' disabled={!skin}>{saving ? 'Đang tạo…' : 'Thêm trang phục'}</button>
						</fieldset>
					</form>
				</section>
				<section className='min-w-0 rounded-2xl border border-white/10 bg-[#1b2028] p-6'>
					<h2 className='text-lg font-semibold'>Danh sách trang phục <span className='ml-2 text-sm font-normal text-gray-400'>{outfits.length} mẫu</span></h2>
					<input aria-label='Tìm trang phục' placeholder='Tìm ID, tên, loại hoặc màu…' className={`${field} mb-5`} value={search} onChange={event => setSearch(event.target.value)} />
					<div className='max-h-[640px] overflow-auto'><table className='w-full text-left text-sm'><thead className='text-gray-400'><tr>{['Hình', 'ID Item', 'Loại', 'ID trang phục', 'Màu'].map(title => <th key={title} className='whitespace-nowrap border-b border-white/10 px-3 py-3 font-medium'>{title}</th>)}</tr></thead><tbody>{filtered.map(item => <tr key={item.detail_id} className='border-b border-white/5'><td className='px-3 py-2'><div className='flex h-14 w-14 items-center justify-center rounded-lg bg-[#13161b]'><img src={getSkinImageUrl(item)} alt={`Minh họa ${item.skin_name}`} loading='lazy' className='max-h-12 max-w-12 object-contain' /></div></td><td className='px-3 py-4 font-mono'>{item.type_id}:{item.detail_id}</td><td className='whitespace-nowrap px-3 py-4'>{catalog?.slots.find(slot => slot.code === item.slot_code)?.label ?? item.slot_code}</td><td className='px-3 py-4 font-mono text-xs'>{item.skin_name}</td><td className='px-3 py-4'><span className='inline-flex items-center gap-2 whitespace-nowrap font-mono'><span className='h-4 w-4 rounded border border-white/25' style={{ backgroundColor: item.color_code }} />{item.color_code}</span></td></tr>)}</tbody></table></div>
					{filtered.length === 0 && <p className='py-12 text-center text-gray-400'>{loading ? 'Đang tải trang phục…' : error ? 'Chưa tải được danh sách. Nhấn Tải lại để thử lại.' : search ? 'Không tìm thấy trang phục phù hợp.' : 'Chưa có trang phục. Tạo mẫu đầu tiên ở bên trái.'}</p>}
				</section>
			</div>
		</div>
	</main>
}
