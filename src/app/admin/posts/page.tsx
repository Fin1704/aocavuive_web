'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import moment from 'moment'

import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'
import {
	Post,
	adminGetPosts,
	adminCreatePost,
	adminUpdatePost,
	adminDeletePost,
} from '@/services/postService'

export default function AdminPostsPage() {
	const router = useRouter()
	const { isLoggedIn, mounted, isAdmin } = useAuth()

	const [posts, setPosts] = useState<Post[]>([])
	const [loading, setLoading] = useState(true)
	const [newTitle, setNewTitle] = useState('')
	const [newContent, setNewContent] = useState('')
	const [newLive, setNewLive] = useState(false)
	const [showNewPreview, setShowNewPreview] = useState(false)
	const [creating, setCreating] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editTitle, setEditTitle] = useState('')
	const [editContent, setEditContent] = useState('')
	const [editLive, setEditLive] = useState(false)
	const [showEditPreview, setShowEditPreview] = useState(false)

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) router.replace('/')
	}, [mounted, isLoggedIn, isAdmin, router])

	useEffect(() => {
		if (!mounted || !isAdmin) return
		fetchPosts()
	}, [mounted, isAdmin])

	const fetchPosts = async () => {
		setLoading(true)
		try {
			const data = await adminGetPosts()
			setPosts(data.posts)
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi tải bài đăng')
		} finally {
			setLoading(false)
		}
	}

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newTitle.trim()) return
		setCreating(true)
		try {
			await adminCreatePost({ title: newTitle, content: newContent, is_live: newLive })
			toast.success('Đã tạo bài đăng!')
			setNewTitle('')
			setNewContent('')
			setNewLive(false)
			setShowNewPreview(false)
			await fetchPosts()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi tạo bài đăng')
		} finally {
			setCreating(false)
		}
	}

	const handleUpdate = async (id: string) => {
		if (!editTitle.trim()) return
		try {
			await adminUpdatePost(id, { title: editTitle, content: editContent, is_live: editLive })
			toast.success('Đã cập nhật bài đăng!')
			setEditingId(null)
			setShowEditPreview(false)
			await fetchPosts()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật bài đăng')
		}
	}

	const handleDelete = async (id: string, title: string) => {
		if (!confirm(`Xóa bài "${title}"?`)) return
		try {
			await adminDeletePost(id)
			toast.success('Đã xóa bài đăng!')
			await fetchPosts()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi xóa bài đăng')
		}
	}

	if (!mounted || !isLoggedIn || !isAdmin) return null

	return (
		<div
			className='min-h-screen p-6 space-y-6'
			style={{ backgroundColor: '#13161b' }}>
			<div className='flex items-center gap-3'>
				<Link
					href='/admin'
					className='text-gray-400 hover:text-white transition-colors text-sm'>
					← Quản trị
				</Link>
				<span className='text-gray-600'>/</span>
				<h1 className='text-2xl font-bold text-white'>Bài đăng sự kiện</h1>
			</div>

			{/* Create form */}
			<div className='bg-semidark rounded-2xl p-6 space-y-4'>
				<h2 className='text-base font-semibold text-white'>Thêm bài đăng mới</h2>
				<form
					onSubmit={handleCreate}
					className='space-y-3'>
					<div className='flex flex-wrap gap-3 items-end'>
						<div className='space-y-1 flex-1 min-w-[200px]'>
							<label className='text-xs text-gray-400'>Tiêu đề *</label>
							<input
								type='text'
								value={newTitle}
								onChange={(e) => setNewTitle(e.target.value)}
								placeholder='Tiêu đề bài đăng'
								className='w-full h-10 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
							/>
						</div>
						<div className='flex items-center gap-2 pb-1'>
							<input
								type='checkbox'
								id='newLive'
								checked={newLive}
								onChange={(e) => setNewLive(e.target.checked)}
								className='w-4 h-4 accent-purple-500'
							/>
							<label
								htmlFor='newLive'
								className='text-xs text-gray-400 select-none'>
								Công khai ngay
							</label>
						</div>
						<button
							type='button'
							onClick={() => setShowNewPreview((prev) => !prev)}
							className='h-10 px-5 rounded-lg text-white font-semibold text-sm bg-white/10 hover:bg-white/20 transition-colors'>
							{showNewPreview ? 'áº¨n preview' : 'Preview'}
						</button>
						<button
							type='submit'
							disabled={creating}
							className='h-10 px-5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60'
							style={{ backgroundImage: style.backgroundImage }}>
							{creating ? 'Đang tạo...' : 'Thêm bài'}
						</button>
					</div>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>Nội dung</label>
						<textarea
							value={newContent}
							onChange={(e) => setNewContent(e.target.value)}
							placeholder='Nội dung bài đăng...'
							rows={3}
							className='w-full rounded-lg bg-[#13161b] border border-white/10 text-white px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30 resize-none'
						/>
					</div>
					{showNewPreview && (
						<div className='space-y-2'>
							<p className='text-xs text-gray-400'>Preview HTML</p>
							<div className='rounded-lg border border-white/10 bg-[#13161b] p-4 text-sm text-gray-200'>
								{newContent.trim() ? (
									<div dangerouslySetInnerHTML={{ __html: newContent }} />
								) : (
									<p className='text-gray-500'>ChÆ°a cÃ³ ná»™i dung Ä‘á»ƒ preview.</p>
								)}
							</div>
						</div>
					)}
				</form>
			</div>

			{/* Posts list */}
			<div className='bg-semidark rounded-2xl p-6 space-y-4'>
				<h2 className='text-base font-semibold text-white'>
					Danh sách ({posts.length})
				</h2>
				{loading ? (
					<p className='text-gray-400 text-sm'>Đang tải...</p>
				) : posts.length === 0 ? (
					<p className='text-gray-400 text-sm'>Chưa có bài đăng nào.</p>
				) : (
					<div className='space-y-3'>
						{posts.map((post) => (
							<div
								key={post.id}
								className='border border-white/5 rounded-xl p-4 space-y-2 hover:bg-white/3 transition-colors'>
								{editingId === post.id ? (
									<div className='space-y-3'>
										<div className='flex flex-wrap gap-3 items-end'>
											<div className='space-y-1 flex-1 min-w-[200px]'>
												<label className='text-xs text-gray-400'>Tiêu đề</label>
												<input
													type='text'
													value={editTitle}
													onChange={(e) => setEditTitle(e.target.value)}
													className='w-full h-10 rounded-lg bg-[#13161b] border border-white/20 text-white px-3 text-sm focus:outline-none focus:border-white/40'
												/>
											</div>
											<div className='flex items-center gap-2 pb-1'>
												<input
													type='checkbox'
													checked={editLive}
													onChange={(e) => setEditLive(e.target.checked)}
													className='w-4 h-4 accent-purple-500'
												/>
												<span className='text-xs text-gray-400'>Công khai</span>
											</div>
										</div>
										<div className='space-y-1'>
											<label className='text-xs text-gray-400'>Nội dung</label>
											<textarea
												value={editContent}
												onChange={(e) => setEditContent(e.target.value)}
												rows={4}
												className='w-full rounded-lg bg-[#13161b] border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/40 resize-none'
											/>
										</div>
										<div className='flex gap-2'>
											<button
												onClick={() => handleUpdate(post.id)}
												className='h-9 px-4 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90'
												style={{ backgroundImage: style.backgroundImage }}>
												Lưu
											</button>
											<button
												onClick={() => setEditingId(null)}
												className='h-9 px-4 rounded-lg text-white text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors'>
												Hủy
											</button>
										</div>
									</div>
								) : (
									<>
										<div className='flex items-start justify-between gap-3'>
											<div className='flex items-center gap-2 min-w-0'>
												<span
													className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${post.is_live ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
													{post.is_live ? 'Live' : 'Draft'}
												</span>
												<p className='font-medium text-white truncate'>{post.title}</p>
											</div>
											<div className='flex gap-2 shrink-0'>
												<button
													onClick={() => {
														setEditingId(post.id)
														setEditTitle(post.title)
														setEditContent(post.content)
														setEditLive(post.is_live)
													}}
													className='px-3 py-1 rounded-lg text-white text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors'>
													Sửa
												</button>
												<button
													onClick={() => handleDelete(post.id, post.title)}
													className='px-3 py-1 rounded-lg text-red-400 text-xs font-semibold bg-red-400/10 hover:bg-red-400/20 transition-colors'>
													Xóa
												</button>
											</div>
										</div>
										{post.content && (
											<p className='text-sm text-gray-400 line-clamp-2'>{post.content}</p>
										)}
										<p className='text-xs text-gray-600'>
											{moment(post.created_at).fromNow()}
										</p>
									</>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
