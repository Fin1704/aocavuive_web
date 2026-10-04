'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'
import { runDatabaseMigration, MigrationResult } from '@/services/migrationService'

const MENU_ITEMS = [
	{
		href: '/admin/outfits',
		label: 'Quản lý trang phục',
		description: 'Tạo trang phục theo 15 nhóm, skin Spine và màu sắc',
		icon: '👕',
	},
	{
		href: '/admin/servers',
		label: 'Quản lý Servers',
		description: 'Thêm, sửa, xóa danh sách máy chủ game',
		icon: '🖥️',
	},
	{
		href: '/admin/csv-links',
		label: 'Quản lý Link CSV',
		description: 'Lưu trữ và ánh xạ link Google Sheets CSV theo Key',
		icon: '📊',
	},
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
		href: '/admin/users',
		label: 'Quản lý Users',
		description: 'Đổi username và thông tin tài khoản người dùng',
		icon: '👤',
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
	const [isMigrating, setIsMigrating] = useState(false)
	const [lastMigrated, setLastMigrated] = useState<string | null>(null)

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) router.replace('/')
	}, [mounted, isLoggedIn, isAdmin, router])

	const handleMigrate = async () => {
		if (
			!window.confirm(
				'Bạn có chắc chắn muốn chạy Migrate Database không?\nThao tác này sẽ áp dụng các migration mới nhất lên cơ sở dữ liệu.'
			)
		) {
			return
		}

		setIsMigrating(true)
		const toastId = toast.loading('Đang tiến hành chạy Migrate Database...')
		try {
			const res = await runDatabaseMigration()
			const executedAt = res.executed_at ? new Date(res.executed_at).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')
			setLastMigrated(executedAt)
			toast.success('Chạy Migrate Database thành công!', { id: toastId })
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Chạy migrate thất bại'
			toast.error(message, { id: toastId })
		} finally {
			setIsMigrating(false)
		}
	}

	if (!mounted || !isLoggedIn || !isAdmin) return null

	return (
		<div className='min-h-screen p-6' style={{ backgroundColor: '#13161b' }}>
			{/* Header with Title and Migrate Button */}
			<div className='flex flex-wrap items-center justify-between gap-4 mb-8'>
				<div>
					<h1 className='text-2xl font-bold text-white'>Trang Quản Trị</h1>
					<p className='text-sm text-gray-400 mt-1'>
						Bảng điều khiển và các công cụ quản trị hệ thống
					</p>
				</div>

				<div className='flex items-center gap-3'>
					{lastMigrated && (
						<span className='text-xs text-emerald-400/80 hidden sm:inline-block'>
							Lần migrate gần nhất: {lastMigrated}
						</span>
					)}
					<button
						onClick={handleMigrate}
						disabled={isMigrating}
						className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-amber-400/20'
						title='Chạy migrate schema database lên bản mới nhất'
					>
						{isMigrating ? (
							<>
								<svg
									className='animate-spin h-4 w-4 text-white'
									fill='none'
									viewBox='0 0 24 24'
								>
									<circle
										className='opacity-25'
										cx='12'
										cy='12'
										r='10'
										stroke='currentColor'
										strokeWidth='4'
									/>
									<path
										className='opacity-75'
										fill='currentColor'
										d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
									/>
								</svg>
								<span>Đang migrate DB...</span>
							</>
						) : (
							<>
								<span>🗄️</span>
								<span>Migrate Database</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* Navigation Cards */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
				{MENU_ITEMS.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className='group bg-semidark rounded-2xl p-6 flex gap-4 items-start hover:bg-white/5 transition-colors border border-white/5 hover:border-white/10'
					>
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
