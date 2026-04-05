'use client'

import {
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	getDocs,
	doc,
	serverTimestamp,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import moment from 'moment'

import { db } from '@/config/firebase'
import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'
import { IBlog } from '@/interfaces/blog'

const emptyForm = {
	slug: '',
	title: '',
	description: '',
	thumbnailURL: '',
	tags: '',
	content: '',
}

export default function AdminBlogsPage() {
	const router = useRouter()
	const { isLoggedIn, mounted, isAdmin } = useAuth()

	const [blogs, setBlogs] = useState<IBlog[]>([])
	const [loading, setLoading] = useState(true)
	const [form, setForm] = useState(emptyForm)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [showForm, setShowForm] = useState(false)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) router.replace('/')
	}, [mounted, isLoggedIn, isAdmin, router])

	useEffect(() => {
		if (!mounted || !isAdmin) return
		fetchBlogs()
	}, [mounted, isAdmin])

	const fetchBlogs = async () => {
		setLoading(true)
		try {
			const snapshot = await getDocs(collection(db, 'blogs'))
			const data = snapshot.docs.map((d) => ({
				id: d.id,
				...d.data(),
			})) as IBlog[]
			data.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			)
			setBlogs(data)
		} catch {
			toast.error('Lỗi tải blogs')
		} finally {
			setLoading(false)
		}
	}

	const openCreate = () => {
		setEditingId(null)
		setForm(emptyForm)
		setShowForm(true)
	}

	const openEdit = (blog: IBlog) => {
		setEditingId(blog.id)
		setForm({
			slug: blog.slug,
			title: blog.title,
			description: blog.description,
			thumbnailURL: blog.thumbnailURL,
			tags: blog.tags?.join(', ') ?? '',
			content: blog.content,
		})
		setShowForm(true)
	}

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!form.slug || !form.title) {
			toast.error('Slug và tiêu đề không được để trống')
			return
		}
		setSaving(true)
		try {
			const payload = {
				slug: form.slug.trim(),
				title: form.title.trim(),
				description: form.description.trim(),
				thumbnailURL: form.thumbnailURL.trim(),
				tags: form.tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				content: form.content.trim(),
				updatedAt: serverTimestamp(),
			}
			if (editingId) {
				await updateDoc(doc(db, 'blogs', editingId), payload)
				toast.success('Đã cập nhật bài viết!')
			} else {
				await addDoc(collection(db, 'blogs'), {
					...payload,
					createdAt: serverTimestamp(),
				})
				toast.success('Đã thêm bài viết mới!')
			}
			setShowForm(false)
			await fetchBlogs()
		} catch {
			toast.error('Lỗi lưu bài viết')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (id: string, title: string) => {
		if (!confirm(`Xóa bài "${title}"?`)) return
		try {
			await deleteDoc(doc(db, 'blogs', id))
			toast.success('Đã xóa bài viết!')
			await fetchBlogs()
		} catch {
			toast.error('Lỗi xóa bài viết')
		}
	}

	if (!mounted || !isLoggedIn || !isAdmin) return null

	return (
		<div className='min-h-screen p-6 space-y-6' style={{ backgroundColor: '#13161b' }}>
			<div className='flex items-center justify-between'>
				<h1 className='text-2xl font-bold text-white'>Quản lý Blogs</h1>
				<button
					onClick={openCreate}
					className='h-10 px-5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90'
					style={{ backgroundImage: style.backgroundImage }}>
					+ Thêm bài viết
				</button>
			</div>

			{/* Form */}
			{showForm && (
				<div className='bg-semidark rounded-2xl p-6 space-y-4'>
					<h2 className='text-lg font-bold text-white'>
						{editingId ? 'Sửa bài viết' : 'Thêm bài viết mới'}
					</h2>
					<form onSubmit={handleSave} className='space-y-4'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div className='space-y-1'>
								<label className='text-xs text-gray-400'>Slug *</label>
								<input
									type='text'
									value={form.slug}
									onChange={(e) => setForm({ ...form, slug: e.target.value })}
									placeholder='bai-viet-cua-toi'
									className='w-full h-10 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
								/>
							</div>
							<div className='space-y-1'>
								<label className='text-xs text-gray-400'>Tiêu đề *</label>
								<input
									type='text'
									value={form.title}
									onChange={(e) => setForm({ ...form, title: e.target.value })}
									placeholder='Tiêu đề bài viết'
									className='w-full h-10 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
								/>
							</div>
							<div className='space-y-1'>
								<label className='text-xs text-gray-400'>Thumbnail URL</label>
								<input
									type='text'
									value={form.thumbnailURL}
									onChange={(e) => setForm({ ...form, thumbnailURL: e.target.value })}
									placeholder='https://...'
									className='w-full h-10 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
								/>
							</div>
							<div className='space-y-1'>
								<label className='text-xs text-gray-400'>Tags (cách nhau bằng dấu phẩy)</label>
								<input
									type='text'
									value={form.tags}
									onChange={(e) => setForm({ ...form, tags: e.target.value })}
									placeholder='cá, game, sự kiện'
									className='w-full h-10 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
								/>
							</div>
						</div>
						<div className='space-y-1'>
							<label className='text-xs text-gray-400'>Mô tả</label>
							<textarea
								value={form.description}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
								placeholder='Mô tả ngắn...'
								rows={2}
								className='w-full rounded-lg bg-[#13161b] border border-white/10 text-white px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30 resize-none'
							/>
						</div>
						<div className='space-y-1'>
							<label className='text-xs text-gray-400'>Nội dung</label>
							<textarea
								value={form.content}
								onChange={(e) => setForm({ ...form, content: e.target.value })}
								placeholder='Nội dung bài viết...'
								rows={8}
								className='w-full rounded-lg bg-[#13161b] border border-white/10 text-white px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30 resize-y'
							/>
						</div>
						<div className='flex gap-3'>
							<button
								type='submit'
								disabled={saving}
								className='h-10 px-6 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60'
								style={{ backgroundImage: style.backgroundImage }}>
								{saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
							</button>
							<button
								type='button'
								onClick={() => setShowForm(false)}
								className='h-10 px-6 rounded-lg text-white font-semibold text-sm bg-white/10 hover:bg-white/20 transition-colors'>
								Hủy
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Table */}
			<div className='bg-semidark rounded-2xl p-6 space-y-4'>
				<h2 className='text-lg font-bold text-white'>Danh sách ({blogs.length})</h2>
				{loading ? (
					<p className='text-gray-400 text-sm'>Đang tải...</p>
				) : blogs.length === 0 ? (
					<p className='text-gray-400 text-sm'>Chưa có bài viết nào.</p>
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full text-sm text-white'>
							<thead>
								<tr className='text-gray-400 border-b border-white/10'>
									<th className='text-left py-2 pr-4'>Thumbnail</th>
									<th className='text-left py-2 pr-4'>Tiêu đề</th>
									<th className='text-left py-2 pr-4'>Slug</th>
									<th className='text-left py-2 pr-4'>Tags</th>
									<th className='text-left py-2 pr-4'>Ngày tạo</th>
									<th className='text-left py-2'>Actions</th>
								</tr>
							</thead>
							<tbody>
								{blogs.map((blog) => (
									<tr
										key={blog.id}
										className='border-b border-white/5 hover:bg-white/5'>
										<td className='py-2 pr-4'>
											{blog.thumbnailURL ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={blog.thumbnailURL}
													alt={blog.title}
													className='w-16 h-10 object-cover rounded-lg'
												/>
											) : (
												<div className='w-16 h-10 rounded-lg bg-white/10 flex items-center justify-center text-gray-500 text-xs'>
													No img
												</div>
											)}
										</td>
										<td className='py-2 pr-4 font-medium max-w-[200px] truncate'>
											{blog.title}
										</td>
										<td className='py-2 pr-4 text-gray-400 max-w-[120px] truncate'>
											{blog.slug}
										</td>
										<td className='py-2 pr-4 text-gray-400'>
											{blog.tags?.slice(0, 2).join(', ')}
											{blog.tags?.length > 2 ? '...' : ''}
										</td>
										<td className='py-2 pr-4 text-gray-400 whitespace-nowrap'>
											{moment(blog.createdAt as unknown as number).fromNow()}
										</td>
										<td className='py-2'>
											<div className='flex gap-2'>
												<button
													onClick={() => openEdit(blog)}
													className='px-3 py-1 rounded-lg text-white text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors'>
													Sửa
												</button>
												<button
													onClick={() => handleDelete(blog.id, blog.title)}
													className='px-3 py-1 rounded-lg text-red-400 text-xs font-semibold bg-red-400/10 hover:bg-red-400/20 transition-colors'>
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
	)
}
