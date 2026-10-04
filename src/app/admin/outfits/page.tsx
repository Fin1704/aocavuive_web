'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Shirt, Copy, ExternalLink, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createOutfit, updateOutfit, deleteOutfit, getOutfitCatalog, getOutfits, getSkinImageUrl, getClientResourcePath } from '@/services/outfitService'
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

	// State cho sửa và xóa
	const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null)
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

	const handleStartEdit = (item: Outfit) => {
		setEditingOutfit(item)
		setSlot(item.slot_code)
		setSkin(item.skin_name)
		setColor(item.color_code)
		setError('')
		setMessage('')
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const handleCancelEdit = () => {
		setEditingOutfit(null)
		setSlot('helmet')
		setSkin('')
		setColor('#FFFFFF')
		setError('')
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
			if (editingOutfit) {
				const updated = await updateOutfit(editingOutfit.detail_id, {
					slot_code: slot,
					skin_name: skin,
					color_code: color.toUpperCase(),
				})
				setOutfits(rows => rows.map(row => row.detail_id === updated.detail_id ? updated : row))
				const msg = `Đã cập nhật Item 1:${updated.detail_id} — ${updated.skin_name}.`
				setMessage(msg)
				toast.success(msg)
				handleCancelEdit()
			} else {
				const created = await createOutfit({ type_id: 1, slot_code: slot, skin_name: skin, color_code: color.toUpperCase() })
				setOutfits(rows => [...rows.filter(row => row.detail_id !== created.detail_id), created])
				const msg = `Đã tạo Item 1:${created.detail_id} — ${created.skin_name}.`
				setMessage(msg)
				toast.success(msg)
				setSkin('')
			}
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
			await deleteOutfit(deletingOutfit.detail_id)
			setOutfits(rows => rows.filter(row => row.detail_id !== deletingOutfit.detail_id))
			if (editingOutfit?.detail_id === deletingOutfit.detail_id) {
				handleCancelEdit()
			}
			const msg = `Đã xóa Item 1:${deletingOutfit.detail_id} (${deletingOutfit.skin_name}).`
			toast.success(msg)
			setMessage(msg)
			setDeletingOutfit(null)
		} catch (error) {
			toast.error(errorText(error))
		} finally {
			setDeleting(false)
		}
	}

	if (!mounted || !isLoggedIn || !isAdmin) return null
	const filtered = outfits.filter(item => `${item.detail_id} ${item.skin_name} ${item.color_code} ${item.slot_code}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.detail_id - a.detail_id)
	const skins = catalog?.items.filter(item => item.slot_code === slot) ?? []
	const selectedSkin = skins.find(item => item.skin_name === skin)

	return <main className='min-h-screen bg-[#13161b] p-4 text-white sm:p-8'>
		<div className='mx-auto max-w-7xl'>
			<Link href='/admin' className='mb-7 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white'><ArrowLeft size={16} /> Trang quản trị</Link>
			<div className='mb-8 flex flex-wrap items-center justify-between gap-4'>
				<div><h1 className='flex items-center gap-3 text-2xl font-bold'><Shirt className='text-cyan-400' /> Trang phục</h1><p className='mt-2 text-sm text-gray-400'>Quản lý mẫu trang phục và màu sắc cho nhân vật.</p></div>
				<button type='button' disabled={loading || saving} onClick={() => void load()} className='flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 disabled:opacity-50 cursor-pointer hover:bg-white/5 transition-colors'><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Tải lại</button>
			</div>
			{error && <p role='alert' className='mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200'>{error}</p>}
			{message && <p role='status' className='mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200'>{message}</p>}
			<div className='grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]'>
				{/* Form Thêm / Sửa trang phục */}
				<section className={`self-start rounded-2xl border p-6 shadow-xl transition-colors ${editingOutfit ? 'border-amber-400/40 bg-[#1e2029]' : 'border-white/10 bg-[#1b2028]'}`}>
					<div className='mb-6 flex items-center justify-between'>
						<div>
							<h2 className={`text-lg font-semibold flex items-center gap-2 ${editingOutfit ? 'text-amber-300' : 'text-white'}`}>
								{editingOutfit ? <><Pencil size={18} /> Sửa trang phục</> : 'Thêm trang phục'}
							</h2>
							{editingOutfit && <p className='text-xs text-amber-400/80 mt-1 font-mono'>Đang sửa Item 1:{editingOutfit.detail_id}</p>}
						</div>
						{editingOutfit && (
							<button
								type='button'
								onClick={handleCancelEdit}
								className='text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors'
							>
								<X size={14} /> Hủy sửa
							</button>
						)}
					</div>
					<form onSubmit={submit}>
						<fieldset disabled={loading || saving || !catalog} className='space-y-5 disabled:opacity-60'>
							<div><p className='text-sm font-medium'>ID Item</p><div className='mt-2 grid grid-cols-2 gap-3'>
								<label className='text-sm text-gray-400' htmlFor='type-id'>TypeID<input id='type-id' className={field} value='1' readOnly /></label>
								<label className='text-sm text-gray-400' htmlFor='detail-id'>DetailID<input id='detail-id' className={field} value={editingOutfit ? String(editingOutfit.detail_id) : 'Tự động cấp'} readOnly /></label>
							</div><p className='mt-2 text-xs text-gray-400'>{editingOutfit ? `Đang chỉnh sửa bản ghi có ID ${editingOutfit.detail_id}.` : 'DetailID tự tăng từ 1, hiển thị sau khi tạo.'}</p></div>
							<label className='block text-sm' htmlFor='outfit-slot'>Loại trang phục (slot_code)<select id='outfit-slot' className={field} value={slot} onChange={event => { setSlot(event.target.value); setSkin('') }} required>{catalog?.slots.map(item => <option key={item.code} value={item.code}>{item.code}</option>)}</select></label>
							<label className='block text-sm' htmlFor='outfit-skin'>ID trang phục<select id='outfit-skin' className={field} value={skin} onChange={event => setSkin(event.target.value)} required><option value=''>Chọn trang phục</option>{skins.map(item => <option key={item.skin_name} value={item.skin_name}>{item.skin_name}</option>)}</select><span className='mt-2 block text-xs text-gray-400'>Tên skin gốc trong Spine · {skins.length} lựa chọn</span></label>
							
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

							<div><label htmlFor='outfit-color' className='text-sm'>Màu trang phục</label><div className='mt-2 flex items-center gap-3'><input id='outfit-color' type='color' value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#FFFFFF'} onChange={event => setColor(event.target.value.toUpperCase())} className='h-11 w-14 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1' /><input aria-label='Mã màu HEX' value={color} onChange={event => setColor(event.target.value.toUpperCase())} pattern='#[0-9a-fA-F]{6}' maxLength={7} required className={`${field} !mt-0 font-mono`} /></div></div>
							<div className='flex gap-3'>
								<button
									type='submit'
									className={`flex-1 rounded-xl py-3 font-semibold text-slate-950 disabled:opacity-50 cursor-pointer transition-colors ${
										editingOutfit ? 'bg-amber-400 hover:bg-amber-300' : 'bg-cyan-400 hover:bg-cyan-300'
									}`}
									disabled={!skin}
								>
									{saving ? (editingOutfit ? 'Đang lưu…' : 'Đang tạo…') : (editingOutfit ? 'Lưu thay đổi' : 'Thêm trang phục')}
								</button>
								{editingOutfit && (
									<button
										type='button'
										onClick={handleCancelEdit}
										disabled={saving}
										className='rounded-xl border border-white/15 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer transition-colors'
									>
										Hủy
									</button>
								)}
							</div>
						</fieldset>
					</form>
				</section>

				{/* Danh sách trang phục */}
				<section className='min-w-0 rounded-2xl border border-white/10 bg-[#1b2028] p-6 shadow-xl'>
					<h2 className='text-lg font-semibold'>Danh sách trang phục <span className='ml-2 text-sm font-normal text-gray-400'>{outfits.length} mẫu</span></h2>
					<input aria-label='Tìm trang phục' placeholder='Tìm ID, tên, loại hoặc màu…' className={`${field} mb-5`} value={search} onChange={event => setSearch(event.target.value)} />
					<div className='max-h-[640px] overflow-auto'>
						<table className='w-full text-left text-sm'>
							<thead className='text-gray-400'>
								<tr>
									{['Hình & Tài nguyên', 'ID Item', 'Loại', 'ID trang phục', 'Màu', 'Thao tác'].map(title => (
										<th key={title} className={`whitespace-nowrap border-b border-white/10 px-3 py-3 font-medium ${title === 'Thao tác' ? 'text-right' : ''}`}>{title}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{filtered.map(item => {
									const isBeingEdited = editingOutfit?.detail_id === item.detail_id
									return (
										<tr key={item.detail_id} className={`border-b transition-colors ${isBeingEdited ? 'bg-amber-400/10 border-amber-400/20' : 'border-white/5 hover:bg-white/[0.02]'}`}>
											{/* Hình ảnh và link tham chiếu */}
											<td className='px-3 py-3'>
												<div className='flex items-center gap-3'>
													<div className='flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-[#13161b] border border-white/5'>
														<img src={getSkinImageUrl(item)} alt={`Minh họa ${item.skin_name}`} loading='lazy' className='max-h-12 max-w-12 object-contain' />
													</div>
													<div className='space-y-1 text-[11px] min-w-[200px]'>
														{/* Server Link */}
														<div className='flex items-center gap-1.5 font-mono'>
															<span className='text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-1 py-0.5 rounded'>Server</span>
															<a
																href={getSkinImageUrl(item)}
																target='_blank'
																rel='noopener noreferrer'
																className='text-cyan-300 hover:underline max-w-[210px] truncate'
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
																<Copy size={11} />
															</button>
														</div>

														{/* Client Path */}
														<div className='flex items-center gap-1.5 font-mono'>
															<span className='text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded'>Client</span>
															<span className='text-amber-300/80 max-w-[210px] truncate' title={getClientResourcePath(item)}>
																{getClientResourcePath(item)}
															</span>
															<button
																type='button'
																onClick={() => handleCopy(getClientResourcePath(item), 'Client Path')}
																className='text-gray-500 hover:text-white p-0.5 rounded cursor-pointer'
																title='Copy Client Path'
															>
																<Copy size={11} />
															</button>
														</div>
													</div>
												</div>
											</td>

											{/* ID Item */}
											<td className='px-3 py-4 font-mono whitespace-nowrap'>{item.type_id}:{item.detail_id}</td>

											{/* Loại */}
											<td className='whitespace-nowrap px-3 py-4 font-mono text-xs text-gray-200'>{item.slot_code}</td>

											{/* ID trang phục */}
											<td className='px-3 py-4 font-mono text-xs'>{item.skin_name}</td>

											{/* Màu */}
											<td className='px-3 py-4'>
												<span className='inline-flex items-center gap-2 whitespace-nowrap font-mono'>
													<span className='h-4 w-4 rounded border border-white/25' style={{ backgroundColor: item.color_code }} />
													{item.color_code}
												</span>
											</td>

											{/* Thao tác */}
											<td className='px-3 py-4 whitespace-nowrap text-right'>
												<div className='flex items-center justify-end gap-2'>
													<button
														type='button'
														onClick={() => handleStartEdit(item)}
														className={`p-1.5 rounded-lg border text-gray-300 cursor-pointer transition-colors ${
															isBeingEdited
																? 'border-amber-400 bg-amber-400/20 text-amber-300'
																: 'border-white/10 bg-white/5 hover:text-amber-300 hover:border-amber-400/40 hover:bg-amber-400/10'
														}`}
														title='Sửa mẫu trang phục này'
													>
														<Pencil size={15} />
													</button>
													<button
														type='button'
														onClick={() => setDeletingOutfit(item)}
														className='p-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-red-400 hover:border-red-400/40 hover:bg-red-400/10 cursor-pointer transition-colors'
														title='Xóa mẫu trang phục này'
													>
														<Trash2 size={15} />
													</button>
												</div>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
					{filtered.length === 0 && <p className='py-12 text-center text-gray-400'>{loading ? 'Đang tải trang phục…' : error ? 'Chưa tải được danh sách. Nhấn Tải lại để thử lại.' : search ? 'Không tìm thấy trang phục phù hợp.' : 'Chưa có trang phục. Tạo mẫu đầu tiên ở bên trái.'}</p>}
				</section>
			</div>
		</div>

		{/* Modal xác nhận xóa */}
		{deletingOutfit && (
			<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150'>
				<div className='w-full max-w-md rounded-2xl border border-red-500/20 bg-[#1b2028] p-6 shadow-2xl space-y-4'>
					<div className='flex items-center gap-3 text-red-400'>
						<div className='p-2 rounded-xl bg-red-500/10 border border-red-500/20'>
							<AlertTriangle size={24} />
						</div>
						<h3 className='text-lg font-bold text-white'>Xác nhận xóa trang phục</h3>
					</div>

					<p className='text-sm text-gray-300'>
						Bạn có chắc chắn muốn xóa trang phục này không? Thao tác này sẽ xóa vĩnh viễn mẫu khỏi hệ thống.
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
							className='flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 cursor-pointer transition-colors disabled:opacity-50'
						>
							{deleting ? (
								<>
									<RefreshCw size={15} className='animate-spin' />
									Đang xóa…
								</>
							) : (
								<>
									<Trash2 size={15} />
									Xóa trang phục
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		)}
	</main>
}
