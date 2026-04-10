'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { FaAt, FaLock } from 'react-icons/fa6'

import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'
import { adminSetUsername } from '@/services/authService'

export default function AdminUsersPage() {
	const router = useRouter()
	const { isLoggedIn, mounted, isAdmin } = useAuth()

	const [userId, setUserId] = useState('')
	const [newUsername, setNewUsername] = useState('')
	const [saving, setSaving] = useState(false)
	const [lastResult, setLastResult] = useState<{ userId: string; username: string } | null>(null)

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) router.replace('/')
	}, [mounted, isLoggedIn, isAdmin, router])

	if (!mounted || !isLoggedIn || !isAdmin) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!userId.trim() || !newUsername.trim()) return
		setSaving(true)
		try {
			const updated = await adminSetUsername(userId.trim(), newUsername.trim())
			toast.success(`Đã đặt username @${updated.username} cho ${updated.email}`)
			setLastResult({ userId: updated.id, username: updated.username! })
			setUserId('')
			setNewUsername('')
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi đặt username')
		} finally {
			setSaving(false)
		}
	}

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
				<h1 className='text-2xl font-bold text-white'>Quản lý Users</h1>
			</div>

			{/* Change username */}
			<div className='bg-semidark rounded-2xl p-6 space-y-5 max-w-lg'>
				<div className='flex items-center gap-3'>
					<div className='w-9 h-9 rounded-xl bg-orange-400/10 flex items-center justify-center'>
						<FaAt size={16} className='text-orange-400' />
					</div>
					<div>
						<p className='font-semibold text-white'>Đổi username</p>
						<p className='text-xs text-gray-500'>Admin có thể thay đổi không giới hạn số lần</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className='space-y-3'>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>User ID</label>
						<input
							type='text'
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							placeholder='UUID của người dùng'
							className='w-full h-10 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm font-mono placeholder:text-gray-600 placeholder:font-sans focus:outline-none focus:border-white/30'
						/>
					</div>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>Username mới</label>
						<div className='relative'>
							<span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none'>@</span>
							<input
								type='text'
								value={newUsername}
								onChange={(e) => setNewUsername(e.target.value)}
								placeholder='ten_nguoi_dung'
								minLength={3}
								maxLength={50}
								pattern='^[a-zA-Z0-9_]+$'
								className='w-full h-10 rounded-lg bg-[#13161b] border border-white/10 text-white pl-7 pr-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
							/>
						</div>
						<p className='text-xs text-gray-600'>3–50 ký tự · Chữ cái, số và dấu gạch dưới (_)</p>
					</div>
					<button
						type='submit'
						disabled={saving || !userId.trim() || !newUsername.trim()}
						className='w-full h-10 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50'
						style={{ backgroundImage: style.backgroundImage }}>
						{saving ? 'Đang lưu...' : 'Đặt username'}
					</button>
				</form>

				{lastResult && (
					<div className='flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20'>
						<FaLock size={12} className='text-green-400 shrink-0' />
						<p className='text-xs text-green-400'>
							Thành công: <span className='font-mono font-semibold'>@{lastResult.username}</span>
							<span className='text-green-500/70 ml-1'>· {lastResult.userId}</span>
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
