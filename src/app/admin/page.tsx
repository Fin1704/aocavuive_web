'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'

const MENU_ITEMS = [
	{
		href: '/admin/vip',
		label: 'Quản lý mốc VIP',
		description: 'Tạo, chỉnh sửa và xóa các mốc VIP theo exp',
		icon: '⭐',
	},
	{
		href: '/admin/exp',
		label: 'Quản lý Exp',
		description: 'Đặt hoặc cộng exp trực tiếp cho người dùng',
		icon: '🎯',
	},
	{
		href: '/admin/posts',
		label: 'Bài đăng sự kiện',
		description: 'Tạo và quản lý các thông báo, sự kiện trong game',
		icon: '📢',
	},
	{
		href: '/admin/subscribers',
		label: 'Subscribers',
		description: 'Xem danh sách người đã đăng ký nhận thông báo',
		icon: '📬',
	},
	{
		href: '/admin/blogs',
		label: 'Quản lý Blogs',
		description: 'Thêm, sửa, xóa các bài viết trên trang web',
		icon: '📝',
	},
]

export default function AdminPage() {
	const router = useRouter()
	const { isLoggedIn, mounted, isAdmin } = useAuth()

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) router.replace('/')
	}, [mounted, isLoggedIn, isAdmin, router])

	if (!mounted || !isLoggedIn || !isAdmin) return null

	return (
		<div
			className='min-h-screen p-6'
			style={{ backgroundColor: '#13161b' }}>
			<h1 className='text-2xl font-bold text-white mb-8'>Trang Quản Trị</h1>

			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
				{MENU_ITEMS.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className='group bg-semidark rounded-2xl p-6 flex gap-4 items-start hover:bg-white/5 transition-colors border border-white/5 hover:border-white/10'>
						<span className='text-3xl mt-0.5'>{item.icon}</span>
						<div className='space-y-1'>
							<p
								className='font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text transition-all'
								style={{ backgroundImage: style.backgroundImage }}
							>
								{item.label}
							</p>
							<p className='text-sm text-gray-400'>{item.description}</p>
						</div>
					</Link>
				))}
			</div>
		</div>
	)
}
