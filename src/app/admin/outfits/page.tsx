'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Shirt, Copy, ExternalLink, Power, PowerOff, AlertTriangle, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createOutfit, updateOutfit, getOutfitCatalog, getOutfits, getSkinImageUrl, getClientResourcePath } from '@/services/outfitService'
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
	const [filterSlot, setFilterSlot] = useState('all')
	const [page, setPage] = useState(1)
	const PAGE_SIZE = 10
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const submitting = useRef(false)
	const [error, setError] = useState('')
	const [message, setMessage] = useState('')

	// Identity của outfit là bất biến; admin chỉ bật/tắt khả năng cấp mới.
	const [deletingOutfit, setDeletingOutfit] = useState<Outfit | null>(null)
	const [deleting, setDeleting] = useState(false)

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

	const handleCopy = (text: string, label: string) => {
		navigator.clipboard.writeText(text)
		toast.success(`Đã sao chép ${label}!`)
	}

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
			const msg = `Đã tạo Item 1:${created.detail_id} — ${created.skin_name}.`
			setMessage(msg)
			toast.success(msg)
			setSkin('')
		} catch (error) {
			const err = errorText(error)
			setError(err)
			toast.error(err)
		} finally {
			submitting.current = false
			setSaving(false)
		}
	}

	async function handleDeleteConfirm() {
		if (!deletingOutfit || deleting) return
		setDeleting(true)
		try {
			const updated = await updateOutfit(deletingOutfit.detail_id, { is_active: false })
			setOutfits(rows => rows.map(row => row.detail_id === updated.detail_id ? updated : row))
			const msg = `Đã ngừng cấp mới Item 1:${deletingOutfit.detail_id}; dữ liệu người chơi được giữ nguyên.`
			toast.success(msg)
			setMessage(msg)
			setDeletingOutfit(null)
		} catch (error) {
			toast.error(errorText(error))
		} finally {
			setDeleting(false)
		}
	}

	async function handleReactivate(item: Outfit) {
		try {
			const updated = await updateOutfit(item.detail_id, { is_active: true })
			setOutfits(rows => rows.map(row => row.detail_id === updated.detail_id ? updated : row))
			const msg = `Đã cho phép cấp mới Item 1:${item.detail_id}.`
			setMessage(msg)
			toast.success(msg)
		} catch (error) {
			toast.error(errorText(error))
		}
	}

	if (!mounted || !isLoggedIn || !isAdmin) return null

	// Đếm số lượng theo từng slot
	const slotCounts = outfits.reduce((acc, item) => {
		acc[item.slot_code] = (acc[item.slot_code] || 0) + 1
		return acc
	}, {} as Record<string, number>)

	const filtered = outfits.filter(item => {
		const matchSlot = filterSlot === 'all' || item.slot_code === filterSlot
		const matchSearch = `${item.detail_id} ${item.skin_name} ${item.color_code} ${item.slot_code}`.toLowerCase().includes(search.toLowerCase())
		return matchSlot && matchSearch
	}).sort((a, b) => b.detail_id - a.detail_id)

	const totalItems = filtered.length
	const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
	const currentPage = Math.min(page, totalPages)
	const paginatedItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

	const skins = catalog?.items.filter(item => item.slot_code === slot) ?? []
	const selectedSkin = skins.find(item => item.skin_name === skin)

	return <main className='min-h-screen bg-[#13161b] p-4 text-white sm:p-6 lg:p-8'>
		<div className='mx-auto max-w-[1720px] w-full'>
			<Link href='/admin' className='mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors'><ArrowLeft size={16} /> Trang quản trị</Link>
			<div className='mb-7 flex flex-wrap items-center justify-between gap-4'>
				<div>
					<h1 className='flex items-center gap-3 text-2xl lg:text-3xl font-bold'><Shirt className='text-cyan-400' /> Trang phục</h1>
					<p className='mt-1.5 text-sm text-gray-400'>Quản lý mẫu trang phục và màu sắc cho nhân vật.</p>
				</div>
				<button type='button' disabled={loading || saving} onClick={() => void load()} className='flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 disabled:opacity-50 cursor-pointer hover:bg-white/5 transition-colors text-sm font-medium'>
					<RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Tải lại
				</button>
			</div>
			{error && <p role='alert' className='mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200'>{error}</p>}
			{message && <p role='status' className='mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200'>{message}</p>}
			
			<div className='grid gap-6 lg:grid-cols-[380px_1fr] items-start'>
				{/* Form thêm identity mới; identity đã phát hành không thể sửa hoặc xóa. */}
				<section className='self-start rounded-2xl border border-white/10 bg-[#1b2028] p-6 shadow-xl'>
					<div className='mb-6 flex items-center justify-between'>
						<div>
							<h2 className='text-lg font-semibold text-white'>Thêm trang phục</h2>
							<p className='mt-1 text-xs text-gray-400'>Item đã tạo chỉ có thể bật/tắt cấp mới để giữ an toàn dữ liệu người chơi.</p>
						</div>
					</div>
					<form onSubmit={submit}>
						<fieldset disabled={loading || saving || !catalog} className='space-y-5 disabled:opacity-60'>
							<div>
								<p className='text-sm font-medium'>ID Item</p>
								<div className='mt-2 grid grid-cols-2 gap-3'>
									<label className='text-sm text-gray-400' htmlFor='type-id'>TypeID<input id='type-id' className={field} value='1' readOnly /></label>
									<label className='text-sm text-gray-400' htmlFor='detail-id'>DetailID<input id='detail-id' className={field} value='Tự động cấp' readOnly /></label>
								</div>
								<p className='mt-2 text-xs text-gray-400'>DetailID tự tăng từ 1, hiển thị sau khi tạo.</p>
							</div>
							<label className='block text-sm' htmlFor='outfit-slot'>Loại trang phục (slot_code)
								<select id='outfit-slot' className={field} value={slot} onChange={event => { setSlot(event.target.value); setSkin('') }} required>
									{catalog?.slots.map(item => <option key={item.code} value={item.code}>{item.code}</option>)}
								</select>
							</label>
							<label className='block text-sm' htmlFor='outfit-skin'>ID trang phục
								<select id='outfit-skin' className={field} value={skin} onChange={event => setSkin(event.target.value)} required>
									<option value=''>Chọn trang phục</option>
									{skins.map(item => <option key={item.skin_name} value={item.skin_name}>{item.skin_name}</option>)}
								</select>
								<span className='mt-2 block text-xs text-gray-400'>Tên skin gốc trong Spine · {skins.length} lựa chọn</span>
							</label>
							
							{/* Preview ảnh minh họa & Link tham chiếu */}
							<div className='rounded-xl border border-white/10 bg-[#13161b] p-3.5 space-y-3'>
								<div className='flex items-center justify-between'>
									<p className='text-xs font-medium text-gray-400'>Ảnh minh họa & Tài nguyên</p>
									{selectedSkin && (
										<span className='text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full'>
											Đồng bộ với Client
										</span>
									)}
								</div>
								<div className='flex min-h-28 items-center justify-center rounded-lg bg-[linear-gradient(45deg,#20252d_25%,transparent_25%,transparent_75%,#20252d_75%),linear-gradient(45deg,#20252d_25%,#171b21_25%,#171b21_75%,#20252d_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]'>
									{selectedSkin ? <img src={getSkinImageUrl(selectedSkin)} alt={`Minh họa ${selectedSkin.skin_name}`} className='max-h-32 max-w-full object-contain p-2' /> : <span className='text-sm text-gray-500'>Chọn một skin để xem</span>}
								</div>

								{selectedSkin && (
									<div className='pt-2.5 border-t border-white/10 space-y-2 text-xs'>
										{/* Link server */}
										<div className='space-y-1'>
											<div className='flex items-center justify-between text-[11px] text-gray-400'>
												<span className='font-medium text-cyan-400'>🌐 Link Server:</span>
												<div className='flex items-center gap-1.5'>
													<a
														href={getSkinImageUrl(selectedSkin)}
														target='_blank'
														rel='noopener noreferrer'
														className='text-gray-400 hover:text-white p-0.5'
														title='Mở ảnh trong tab mới'
													>
														<ExternalLink size={13} />
													</a>
													<button
														type='button'
														onClick={() => handleCopy(getSkinImageUrl(selectedSkin), 'Link Server')}
														className='text-gray-400 hover:text-white p-0.5 cursor-pointer'
														title='Copy link Server'
													>
														<Copy size={13} />
													</button>
												</div>
											</div>
											<div className='font-mono text-[11px] text-gray-300 break-all bg-black/30 p-1.5 rounded border border-white/5 select-all'>
												{getSkinImageUrl(selectedSkin)}
											</div>
										</div>

										{/* Path client */}
										<div className='space-y-1'>
											<div className='flex items-center justify-between text-[11px] text-gray-400'>
												<span className='font-medium text-amber-400'>🎮 Client Resource:</span>
												<button
													type='button'
													onClick={() => handleCopy(getClientResourcePath(selectedSkin), 'Client Path')}
													className='text-gray-400 hover:text-white p-0.5 cursor-pointer'
													title='Copy Client Path'
												>
													<Copy size={13} />
												</button>
											</div>
											<div className='font-mono text-[11px] text-amber-300/90 break-all bg-black/30 p-1.5 rounded border border-white/5 select-all'>
												{getClientResourcePath(selectedSkin)}
											</div>
										</div>
									</div>
								)}
							</div>

							<div>
								<label htmlFor='outfit-color' className='text-sm'>Màu trang phục</label>
								<div className='mt-2 flex items-center gap-3'>
									<input id='outfit-color' type='color' value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#FFFFFF'} onChange={event => setColor(event.target.value.toUpperCase())} className='h-11 w-14 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1' />
									<input aria-label='Mã màu HEX' value={color} onChange={event => setColor(event.target.value.toUpperCase())} pattern='#[0-9a-fA-F]{6}' maxLength={7} required className={`${field} !mt-0 font-mono`} />
								</div>
							</div>
							<div className='flex gap-3'>
								<button
									type='submit'
									className='flex-1 rounded-xl bg-cyan-400 py-3 font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-400/20'
									disabled={!skin}
								>
									{saving ? 'Đang tạo…' : 'Thêm trang phục'}
								</button>
							</div>
						</fieldset>
					</form>
				</section>

				{/* Danh sách trang phục rộng rãi */}
				<section className='min-w-0 rounded-2xl border border-white/10 bg-[#1b2028] p-6 shadow-xl'>
					<div className='mb-5 flex flex-wrap items-center justify-between gap-3'>
						<div>
							<h2 className='text-xl font-bold text-white flex items-center gap-2.5'>
								Danh sách trang phục
								<span className='rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-400/20'>
									{outfits.length} mẫu
								</span>
							</h2>
							<p className='mt-1 text-xs text-gray-400'>
								Hiển thị 10 mẫu mỗi trang, phân loại theo slot trang bị để dễ quản lý.
							</p>
						</div>
					</div>

					{/* Thanh công cụ tìm kiếm và lọc theo loại */}
					<div className='mb-5 space-y-3.5'>
						<div className='flex flex-wrap items-center gap-3'>
							{/* Ô tìm kiếm */}
							<div className='relative flex-1 min-w-[240px]'>
								<input
									aria-label='Tìm trang phục'
									placeholder='Tìm theo ID (1:10), tên skin, loại hoặc mã màu…'
									className={`${field} !mt-0 text-sm`}
									value={search}
									onChange={event => { setSearch(event.target.value); setPage(1); }}
								/>
							</div>

							{/* Dropdown lọc loại */}
							<div className='flex items-center gap-2'>
								<Filter size={15} className='text-gray-400 hidden sm:block' />
								<select
									aria-label='Lọc theo loại trang bị'
									className='h-[42px] rounded-xl border border-white/15 bg-[#13161b] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer min-w-[180px]'
									value={filterSlot}
									onChange={event => { setFilterSlot(event.target.value); setPage(1); }}
								>
									<option value='all'>Tất cả loại ({outfits.length})</option>
									{catalog?.slots.map(s => (
										<option key={s.code} value={s.code}>
											{s.code} ({slotCounts[s.code] || 0})
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Thanh Filter Pills theo từng loại trang bị */}
						<div className='flex items-center gap-1.5 overflow-x-auto pb-1 text-xs'>
							<button
								type='button'
								onClick={() => { setFilterSlot('all'); setPage(1); }}
								className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
									filterSlot === 'all'
										? 'bg-cyan-400 text-slate-950 font-semibold shadow-sm'
										: 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
								}`}
							>
								<span>Tất cả</span>
								<span className={`rounded-full px-1.5 py-0.2 text-[10px] ${filterSlot === 'all' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-gray-400'}`}>
									{outfits.length}
								</span>
							</button>
							{catalog?.slots.map(s => {
								const count = slotCounts[s.code] || 0
								const isActive = filterSlot === s.code
								return (
									<button
										key={s.code}
										type='button'
										onClick={() => { setFilterSlot(s.code); setPage(1); }}
										className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
											isActive
												? 'bg-cyan-400 text-slate-950 font-semibold shadow-sm'
												: 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
										}`}
									>
										<span>{s.code}</span>
										<span className={`rounded-full px-1.5 py-0.2 text-[10px] ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-gray-400'}`}>
											{count}
										</span>
									</button>
								)
							})}
						</div>
					</div>

					{/* Bảng danh sách - không bị giới hạn chiều cao gây cuộn kép */}
					<div className='overflow-x-auto rounded-xl border border-white/10 bg-[#13161b]/40'>
						<table className='w-full text-left text-sm'>
							<thead className='bg-white/[0.03] text-gray-400 text-xs uppercase tracking-wider'>
								<tr>
									{['Hình & Tài nguyên', 'ID Item', 'Loại', 'ID trang phục', 'Màu', 'Trạng thái', 'Thao tác'].map(title => (
										<th key={title} className={`whitespace-nowrap border-b border-white/10 px-4 py-3.5 font-semibold ${title === 'Thao tác' ? 'text-right' : ''}`}>{title}</th>
									))}
								</tr>
							</thead>
							<tbody className='divide-y divide-white/5'>
								{paginatedItems.map(item => (
									<tr key={item.detail_id} className={`transition-colors hover:bg-white/[0.03] ${item.is_active ? '' : 'opacity-60 bg-black/20'}`}>
										{/* Hình ảnh và link tham chiếu */}
										<td className='px-4 py-3.5'>
											<div className='flex items-center gap-3.5'>
												<div className='flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-[#13161b] border border-white/10 p-1 shadow-inner'>
													<img src={getSkinImageUrl(item)} alt={`Minh họa ${item.skin_name}`} loading='lazy' className='max-h-14 max-w-14 object-contain' />
												</div>
												<div className='space-y-1.5 text-xs min-w-[220px]'>
													{/* Server Link */}
													<div className='flex items-center gap-1.5 font-mono'>
														<span className='text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded'>Server</span>
														<a
															href={getSkinImageUrl(item)}
															target='_blank'
															rel='noopener noreferrer'
															className='text-cyan-300 hover:underline max-w-[220px] truncate text-[11px]'
															title={getSkinImageUrl(item)}
														>
															{item.image_path}
														</a>
														<button
															type='button'
															onClick={() => handleCopy(getSkinImageUrl(item), 'Link Server')}
															className='text-gray-500 hover:text-white p-0.5 rounded cursor-pointer'
															title='Copy Server URL'
														>
															<Copy size={12} />
														</button>
													</div>

													{/* Client Path */}
													<div className='flex items-center gap-1.5 font-mono'>
														<span className='text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded'>Client</span>
														<span className='text-amber-300/80 max-w-[220px] truncate text-[11px]' title={getClientResourcePath(item)}>
															{getClientResourcePath(item)}
														</span>
														<button
															type='button'
															onClick={() => handleCopy(getClientResourcePath(item), 'Client Path')}
															className='text-gray-500 hover:text-white p-0.5 rounded cursor-pointer'
															title='Copy Client Path'
														>
															<Copy size={12} />
														</button>
													</div>
												</div>
											</div>
										</td>

										{/* ID Item */}
										<td className='px-4 py-3.5 font-mono whitespace-nowrap font-bold text-white text-sm'>
											{item.type_id}:{item.detail_id}
										</td>

										{/* Loại */}
										<td className='whitespace-nowrap px-4 py-3.5'>
											<span className='rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-cyan-300'>
												{item.slot_code}
											</span>
										</td>

										{/* ID trang phục */}
										<td className='px-4 py-3.5 font-mono text-xs text-gray-200'>
											{item.skin_name}
										</td>

										{/* Màu */}
										<td className='px-4 py-3.5'>
											<span className='inline-flex items-center gap-2 whitespace-nowrap font-mono text-xs'>
												<span className='h-4 w-4 rounded-md border border-white/25 shadow-sm' style={{ backgroundColor: item.color_code }} />
												{item.color_code}
											</span>
										</td>

										{/* Trạng thái */}
										<td className='px-4 py-3.5 whitespace-nowrap'>
											<span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${item.is_active ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20' : 'bg-gray-500/15 text-gray-400 border border-white/5'}`}>
												<span className={`h-1.5 w-1.5 rounded-full ${item.is_active ? 'bg-emerald-400' : 'bg-gray-500'}`} />
												{item.is_active ? 'Đang cấp' : 'Ngừng cấp'}
											</span>
										</td>

										{/* Thao tác */}
										<td className='px-4 py-3.5 whitespace-nowrap text-right'>
											<div className='flex items-center justify-end gap-2'>
												{item.is_active ? <button
													type='button'
													onClick={() => setDeletingOutfit(item)}
													className='p-2 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-amber-300 hover:border-amber-400/40 hover:bg-amber-400/10 cursor-pointer transition-colors'
													title='Ngừng cấp mới mẫu này'
												>
													<PowerOff size={15} />
												</button> : <button
													type='button'
													onClick={() => void handleReactivate(item)}
													className='p-2 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-emerald-300 hover:border-emerald-400/40 hover:bg-emerald-400/10 cursor-pointer transition-colors'
													title='Cho phép cấp mới mẫu này'
												>
													<Power size={15} />
												</button>}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{filtered.length === 0 && (
						<p className='py-14 text-center text-gray-400 text-sm'>
							{loading ? 'Đang tải trang phục…' : error ? 'Chưa tải được danh sách. Nhấn Tải lại để thử lại.' : search ? 'Không tìm thấy trang phục phù hợp với điều kiện lọc.' : 'Chưa có trang phục nào.'}
						</p>
					)}

					{/* Thanh Phân Trang 10 món 1 trang */}
					{filtered.length > 0 && (
						<div className='mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-gray-400'>
							<div>
								Hiển thị <span className='font-semibold text-white'>{(currentPage - 1) * PAGE_SIZE + 1}</span> -{' '}
								<span className='font-semibold text-white'>{Math.min(currentPage * PAGE_SIZE, totalItems)}</span> trong số{' '}
								<span className='font-semibold text-cyan-400'>{totalItems}</span> mẫu
							</div>

							<div className='flex items-center gap-1.5'>
								<button
									type='button'
									onClick={() => setPage(p => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className='flex items-center gap-1 rounded-lg border border-white/10 bg-[#13161b] px-3 py-1.5 text-xs text-gray-300 hover:border-cyan-400/40 hover:text-white disabled:opacity-40 disabled:hover:border-white/10 disabled:cursor-not-allowed cursor-pointer transition-colors'
								>
									<ChevronLeft size={14} /> Trước
								</button>

								<div className='flex items-center gap-1'>
									{Array.from({ length: totalPages }, (_, i) => i + 1)
										.filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
										.reduce<(number | string)[]>((acc, p, idx, arr) => {
											if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
												acc.push('...')
											}
											acc.push(p)
											return acc
										}, [])
										.map((item, idx) => {
											if (item === '...') {
												return <span key={`ellipsis-${idx}`} className='px-1.5 text-gray-500'>...</span>
											}
											const pageNum = Number(item)
											const isActive = pageNum === currentPage
											return (
												<button
													key={pageNum}
													type='button'
													onClick={() => setPage(pageNum)}
													className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold cursor-pointer transition-colors ${
														isActive
															? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20'
															: 'border border-white/10 bg-[#13161b] text-gray-300 hover:border-white/20 hover:text-white'
													}`}
												>
													{pageNum}
												</button>
											)
										})}
								</div>

								<button
									type='button'
									onClick={() => setPage(p => Math.min(totalPages, p + 1))}
									disabled={currentPage === totalPages}
									className='flex items-center gap-1 rounded-lg border border-white/10 bg-[#13161b] px-3 py-1.5 text-xs text-gray-300 hover:border-cyan-400/40 hover:text-white disabled:opacity-40 disabled:hover:border-white/10 disabled:cursor-not-allowed cursor-pointer transition-colors'
								>
									Sau <ChevronRight size={14} />
								</button>
							</div>
						</div>
					)}
				</section>
			</div>
		</div>

		{/* Modal xác nhận ngừng cấp mới */}
		{deletingOutfit && (
			<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150'>
				<div className='w-full max-w-md rounded-2xl border border-amber-500/20 bg-[#1b2028] p-6 shadow-2xl space-y-4'>
					<div className='flex items-center gap-3 text-amber-400'>
						<div className='p-2 rounded-xl bg-amber-500/10 border border-amber-500/20'>
							<AlertTriangle size={24} />
						</div>
						<h3 className='text-lg font-bold text-white'>Xác nhận ngừng cấp mới</h3>
					</div>

					<p className='text-sm text-gray-300'>
						Item vẫn được giữ trong catalog và đồ người chơi hiện có vẫn dùng bình thường. Chỉ các lượt cấp mới sẽ bị chặn.
					</p>

					<div className='flex items-center gap-3 rounded-xl border border-white/10 bg-[#13161b] p-3'>
						<div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#1b2028] border border-white/5'>
							<img src={getSkinImageUrl(deletingOutfit)} alt={`Minh họa ${deletingOutfit.skin_name}`} className='max-h-10 max-w-10 object-contain' />
						</div>
						<div className='text-xs space-y-1 font-mono'>
							<div className='font-bold text-white'>Item 1:{deletingOutfit.detail_id}</div>
							<div className='text-gray-400'>{deletingOutfit.skin_name} ({deletingOutfit.slot_code})</div>
							<div className='flex items-center gap-1.5'>
								<span>Màu:</span>
								<span className='inline-block h-3 w-3 rounded border border-white/30' style={{ backgroundColor: deletingOutfit.color_code }} />
								<span>{deletingOutfit.color_code}</span>
							</div>
						</div>
					</div>

					<div className='flex justify-end gap-3 pt-2'>
						<button
							type='button'
							disabled={deleting}
							onClick={() => setDeletingOutfit(null)}
							className='rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer transition-colors disabled:opacity-50'
						>
							Hủy
						</button>
						<button
							type='button'
							disabled={deleting}
							onClick={handleDeleteConfirm}
							className='flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer transition-colors disabled:opacity-50'
						>
							{deleting ? (
								<>
									<RefreshCw size={15} className='animate-spin' />
									Đang cập nhật…
								</>
							) : (
								<>
									<PowerOff size={15} />
									Ngừng cấp mới
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		)}
	</main>
}
