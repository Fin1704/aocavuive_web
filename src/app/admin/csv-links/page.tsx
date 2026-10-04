'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import {
	CsvLink,
	getAdminCsvLinks,
	createCsvLink,
	updateCsvLink,
	deleteCsvLink,
	getCsvLinkByKey,
	PublicCsvLink,
} from '@/services/csvLinkService'

interface FormState {
	key: string
	name: string
	url: string
	description: string
	is_active: number
}

const EMPTY_FORM: FormState = {
	key: '',
	name: '',
	url: '',
	description: '',
	is_active: 1,
}

export default function AdminCsvLinksPage() {
	const router = useRouter()
	const { isLoggedIn, mounted, isAdmin } = useAuth()

	const [links, setLinks] = useState<CsvLink[]>([])
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')

	// Form create / edit
	const [form, setForm] = useState<FormState>(EMPTY_FORM)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Quick Test Key
	const [testKey, setTestKey] = useState('')
	const [testResult, setTestResult] = useState<PublicCsvLink | null>(null)
	const [isTesting, setIsTesting] = useState(false)

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) {
			router.replace('/')
			return
		}
		fetchLinks()
	}, [mounted, isLoggedIn, isAdmin, router])

	const fetchLinks = async () => {
		setLoading(true)
		try {
			const data = await getAdminCsvLinks()
			setLinks(data)
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi tải danh sách CSV links')
		} finally {
			setLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!form.key.trim() || !form.name.trim() || !form.url.trim()) {
			toast.error('Vui lòng điền đầy đủ Key, Tên và URL CSV')
			return
		}

		setIsSubmitting(true)
		try {
			if (editingId) {
				await updateCsvLink(editingId, {
					key: form.key.trim(),
					name: form.name.trim(),
					url: form.url.trim(),
					description: form.description.trim() || null,
					is_active: form.is_active,
				})
				toast.success('Đã cập nhật link CSV!')
			} else {
				await createCsvLink({
					key: form.key.trim(),
					name: form.name.trim(),
					url: form.url.trim(),
					description: form.description.trim() || null,
					is_active: form.is_active,
				})
				toast.success('Đã thêm link CSV mới!')
			}
			setForm(EMPTY_FORM)
			setEditingId(null)
			await fetchLinks()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Thao tác thất bại')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleEdit = (item: CsvLink) => {
		setEditingId(item.id)
		setForm({
			key: item.key,
			name: item.name,
			url: item.url,
			description: item.description ?? '',
			is_active: item.is_active,
		})
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const handleCancelEdit = () => {
		setEditingId(null)
		setForm(EMPTY_FORM)
	}

	const handleDelete = async (id: string, keyName: string) => {
		if (!window.confirm(`Bạn có chắc chắn muốn xóa link CSV có key "${keyName}"?`)) return

		try {
			await deleteCsvLink(id)
			toast.success('Đã xóa link CSV!')
			await fetchLinks()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Xóa thất bại')
		}
	}

	const handleCopy = (text: string, label: string) => {
		navigator.clipboard.writeText(text)
		toast.success(`Đã sao chép ${label}!`)
	}

	const handleTestKey = async () => {
		if (!testKey.trim()) {
			toast.error('Vui lòng nhập key để thử nghiệm')
			return
		}
		setIsTesting(true)
		setTestResult(null)
		try {
			const res = await getCsvLinkByKey(testKey.trim())
			setTestResult(res)
			toast.success(`Tìm thấy link CSV cho key "${testKey.trim()}"!`)
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Không tìm thấy key này')
		} finally {
			setIsTesting(false)
		}
	}

	if (!mounted || !isLoggedIn || !isAdmin) return null

	const filteredLinks = links.filter(
		(l) =>
			l.key.toLowerCase().includes(search.toLowerCase()) ||
			l.name.toLowerCase().includes(search.toLowerCase()) ||
			(l.description && l.description.toLowerCase().includes(search.toLowerCase()))
	)

	const inputCls =
		'h-10 rounded-xl bg-[#13161b] border border-white/10 text-white px-3.5 text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors w-full'

	return (
		<div className='min-h-screen p-6 space-y-8' style={{ backgroundColor: '#13161b' }}>
			{/* Top Header */}
			<div className='flex flex-wrap items-center justify-between gap-4'>
				<div>
					<div className='flex items-center gap-2 mb-2'>
						<Link
							href='/admin'
							className='text-xs text-gray-400 hover:text-white transition-colors'
						>
							← Quay lại Quản trị
						</Link>
					</div>
					<h1 className='text-2xl font-bold text-white flex items-center gap-2.5'>
						<span>📊</span>
						<span>Quản Lý Link CSV Google</span>
					</h1>
					<p className='text-sm text-gray-400 mt-1'>
						Lưu trữ link Google Sheets CSV theo Key duy nhất để Game Client và Web tự động tải dữ liệu
					</p>
				</div>
			</div>

			{/* Main Grid: Form on left/top, Table on right/bottom */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
				{/* Form Thêm / Sửa Link */}
				<div className='bg-[#1c2128] border border-white/10 rounded-2xl p-6 shadow-xl'>
					<h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
						<span>{editingId ? '✏️' : '➕'}</span>
						<span>{editingId ? 'Cập Nhật Link CSV' : 'Thêm Link CSV Mới'}</span>
					</h2>

					<form onSubmit={handleSubmit} className='space-y-4'>
						<div>
							<label className='block text-xs font-medium text-gray-300 mb-1.5'>
								Key định danh (Duy nhất) <span className='text-red-400'>*</span>
							</label>
							<input
								type='text'
								className={inputCls}
								placeholder='VD: fish_rates, item_catalog, quests'
								value={form.key}
								onChange={(e) => setForm({ ...form, key: e.target.value })}
								required
							/>
							<p className='text-[11px] text-gray-500 mt-1'>
								Chỉ chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới. User/Game sẽ dùng key này để lấy link.
							</p>
						</div>

						<div>
							<label className='block text-xs font-medium text-gray-300 mb-1.5'>
								Tên gợi nhớ <span className='text-red-400'>*</span>
							</label>
							<input
								type='text'
								className={inputCls}
								placeholder='VD: Bảng tỷ lệ cá hồ nước ngọt'
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								required
							/>
						</div>

						<div>
							<label className='block text-xs font-medium text-gray-300 mb-1.5'>
								URL CSV Google Sheets <span className='text-red-400'>*</span>
							</label>
							<input
								type='url'
								className={inputCls}
								placeholder='https://docs.google.com/spreadsheets/d/.../export?format=csv'
								value={form.url}
								onChange={(e) => setForm({ ...form, url: e.target.value })}
								required
							/>
							<p className='text-[11px] text-gray-500 mt-1'>
								Link chia sẻ dạng CSV (hoặc link Google Sheets xuất bản dạng CSV).
							</p>
						</div>

						<div>
							<label className='block text-xs font-medium text-gray-300 mb-1.5'>
								Mô tả ghi chú (Tùy chọn)
							</label>
							<textarea
								className='w-full rounded-xl bg-[#13161b] border border-white/10 text-white p-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors h-20 resize-none'
								placeholder='Ghi chú về phiên bản, cách sử dụng hoặc nội dung sheet...'
								value={form.description}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
							/>
						</div>

						<div>
							<label className='block text-xs font-medium text-gray-300 mb-1.5'>
								Trạng thái
							</label>
							<select
								className={inputCls}
								value={form.is_active}
								onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}
							>
								<option value={1}>🟢 Kích hoạt (User có thể lấy)</option>
								<option value={0}>🔴 Tạm ẩn (Vô hiệu hóa)</option>
							</select>
						</div>

						<div className='flex items-center gap-2 pt-2'>
							<button
								type='submit'
								disabled={isSubmitting}
								className='flex-1 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-orange-600/20 disabled:opacity-50 transition-all cursor-pointer'
							>
								{isSubmitting ? 'Đang lưu...' : editingId ? 'Lưu Thay Đổi' : 'Tạo Link CSV'}
							</button>

							{editingId && (
								<button
									type='button'
									onClick={handleCancelEdit}
									className='px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/10 hover:bg-white/15 transition-colors cursor-pointer'
								>
									Hủy
								</button>
							)}
						</div>
					</form>
				</div>

				{/* Danh sách & Công cụ test */}
				<div className='lg:col-span-2 space-y-6'>
					{/* Quick Tester Tool */}
					<div className='bg-[#1c2128] border border-white/10 rounded-2xl p-5 shadow-lg'>
						<h3 className='text-sm font-semibold text-white mb-2 flex items-center gap-2'>
							<span>🔍</span>
							<span>Thử Nghiệm Tra Cứu Key (Mô phỏng User / Client)</span>
						</h3>
						<p className='text-xs text-gray-400 mb-3'>
							Kiểm tra API public: <code>GET /api/v1/csv-links/[key]</code> mà user và game client sẽ gọi.
						</p>

						<div className='flex gap-2'>
							<input
								type='text'
								className={inputCls}
								placeholder='Nhập key cần test (VD: fish_rates)'
								value={testKey}
								onChange={(e) => setTestKey(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handleTestKey()}
							/>
							<button
								type='button'
								onClick={handleTestKey}
								disabled={isTesting}
								className='px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50'
							>
								{isTesting ? 'Đang kiểm tra...' : 'Tra Cứu'}
							</button>
						</div>

						{testResult && (
							<div className='mt-3 p-3.5 rounded-xl bg-black/30 border border-emerald-500/30 text-xs space-y-1.5 animate-fadeIn'>
								<div className='flex items-center justify-between text-emerald-400 font-semibold'>
									<span>Key: {testResult.key}</span>
									<span className='text-[10px] text-gray-400'>
										Cập nhật: {new Date(testResult.updated_at).toLocaleString('vi-VN')}
									</span>
								</div>
								<div className='text-white font-medium'>{testResult.name}</div>
								{testResult.description && (
									<div className='text-gray-400'>{testResult.description}</div>
								)}
								<div className='flex items-center gap-2 pt-1'>
									<a
										href={testResult.url}
										target='_blank'
										rel='noopener noreferrer'
										className='text-blue-400 hover:underline truncate max-w-md'
									>
										{testResult.url}
									</a>
									<button
										onClick={() => handleCopy(testResult.url, 'link CSV')}
										className='px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] cursor-pointer'
									>
										Copy Link
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Search & List Table */}
					<div className='bg-[#1c2128] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<h3 className='text-lg font-semibold text-white flex items-center gap-2'>
								<span>📋</span>
								<span>Danh Sách Links ({filteredLinks.length})</span>
							</h3>

							<div className='w-full sm:w-64'>
								<input
									type='text'
									className={inputCls}
									placeholder='Tìm theo key, tên, mô tả...'
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>
						</div>

						{loading ? (
							<div className='text-center py-12 text-gray-400 text-sm'>
								Đang tải danh sách link CSV...
							</div>
						) : filteredLinks.length === 0 ? (
							<div className='text-center py-12 text-gray-400 text-sm'>
								{search ? 'Không tìm thấy link nào khớp với từ khóa tìm kiếm.' : 'Chưa có link CSV nào. Hãy tạo link đầu tiên ở form bên trái!'}
							</div>
						) : (
							<div className='overflow-x-auto'>
								<table className='w-full text-left text-sm border-collapse'>
									<thead>
										<tr className='border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider'>
											<th className='py-3 px-3'>Key</th>
											<th className='py-3 px-3'>Tên & Mô tả</th>
											<th className='py-3 px-3'>Trạng thái</th>
											<th className='py-3 px-3'>URL CSV</th>
											<th className='py-3 px-3 text-right'>Thao tác</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-white/5'>
										{filteredLinks.map((item) => (
											<tr key={item.id} className='hover:bg-white/[0.02] transition-colors'>
												{/* Key */}
												<td className='py-3.5 px-3 font-mono font-bold text-amber-400 whitespace-nowrap'>
													<div className='flex items-center gap-1.5'>
														<span>{item.key}</span>
														<button
															onClick={() => handleCopy(item.key, 'key')}
															className='text-gray-500 hover:text-white p-1 rounded hover:bg-white/10 text-xs cursor-pointer'
															title='Copy key'
														>
															📋
														</button>
													</div>
												</td>

												{/* Name & Desc */}
												<td className='py-3.5 px-3'>
													<div className='font-medium text-white'>{item.name}</div>
													{item.description && (
														<div className='text-xs text-gray-400 truncate max-w-xs'>
															{item.description}
														</div>
													)}
												</td>

												{/* Status */}
												<td className='py-3.5 px-3 whitespace-nowrap'>
													{item.is_active ? (
														<span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
															Kích hoạt
														</span>
													) : (
														<span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20'>
															Tạm ẩn
														</span>
													)}
												</td>

												{/* URL */}
												<td className='py-3.5 px-3 max-w-[220px]'>
													<div className='flex items-center gap-2'>
														<a
															href={item.url}
															target='_blank'
															rel='noopener noreferrer'
															className='text-xs text-blue-400 hover:underline truncate'
															title={item.url}
														>
															{item.url}
														</a>
														<button
															onClick={() => handleCopy(item.url, 'link CSV')}
															className='text-gray-500 hover:text-white p-1 rounded hover:bg-white/10 text-xs flex-shrink-0 cursor-pointer'
															title='Copy URL'
														>
															🔗
														</button>
													</div>
												</td>

												{/* Actions */}
												<td className='py-3.5 px-3 text-right whitespace-nowrap'>
													<div className='flex items-center justify-end gap-1.5'>
														<button
															onClick={() => handleEdit(item)}
															className='px-2.5 py-1 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer'
														>
															Sửa
														</button>
														<button
															onClick={() => handleDelete(item.id, item.key)}
															className='px-2.5 py-1 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer'
														>
															Xóa
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
