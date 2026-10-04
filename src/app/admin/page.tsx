'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Database, ShieldAlert } from 'lucide-react'

import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'
import { runDatabaseMigration } from '@/services/migrationService'

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
	const [migrationOpen, setMigrationOpen] = useState(false)
	const [migrationSecret, setMigrationSecret] = useState('')
	const [isMigrating, setIsMigrating] = useState(false)
	const [lastMigrated, setLastMigrated] = useState<string | null>(null)

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) router.replace('/')
	}, [mounted, isLoggedIn, isAdmin, router])

	const closeMigration = () => {
		if (isMigrating) return
		setMigrationSecret('')
		setMigrationOpen(false)
	}

	const handleMigrate = async () => {
		const secret = migrationSecret.trim()
		if (!secret || isMigrating) return
		setIsMigrating(true)
		const toastId = toast.loading('Đang chạy database migration…')
		try {
			const result = await runDatabaseMigration(secret)
			setLastMigrated(new Date(result.executed_at).toLocaleString('vi-VN'))
			setMigrationOpen(false)
			toast.success('Migration database thành công.', { id: toastId })
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Migration database thất bại.', { id: toastId })
		} finally {
			setMigrationSecret('')
			setIsMigrating(false)
		}
	}

	if (!mounted || !isLoggedIn || !isAdmin) return null

	return (
		<div className='min-h-screen p-6' style={{ backgroundColor: '#13161b' }}>
			<div className='mb-8 flex flex-wrap items-center justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-bold text-white'>Trang Quản Trị</h1>
					<p className='text-sm text-gray-400 mt-1'>
						Bảng điều khiển và các công cụ quản trị hệ thống
					</p>
				</div>
				<div className='flex items-center gap-3'>
					{lastMigrated && <span className='hidden text-xs text-emerald-400/80 sm:inline'>Lần chạy: {lastMigrated}</span>}
					<button
						type='button'
						onClick={() => setMigrationOpen(true)}
						className='inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-400/20 bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:from-amber-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer'
					>
						<Database size={18} aria-hidden='true' /> Migrate Database
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

			{migrationOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm' role='presentation'>
					<form
						onSubmit={(event) => { event.preventDefault(); void handleMigrate() }}
						role='dialog'
						aria-modal='true'
						aria-labelledby='migration-dialog-title'
						aria-describedby='migration-dialog-description'
						className='w-full max-w-md space-y-5 rounded-2xl border border-amber-400/20 bg-[#1b2028] p-6 text-white shadow-2xl'
					>
						<div>
							<h2 id='migration-dialog-title' className='flex items-center gap-2 text-lg font-bold'><ShieldAlert size={20} className='text-amber-400' aria-hidden='true' /> Chạy Database Migration</h2>
							<p id='migration-dialog-description' className='mt-2 text-sm leading-6 text-gray-300'>Nhập MIGRATE_SECRET trong file .env của Account. Secret chỉ dùng cho request này và không được lưu trên trình duyệt.</p>
						</div>
						<label className='block text-sm text-gray-300'>
							Migration secret
							<input
								autoFocus
								type='password'
								autoComplete='off'
								value={migrationSecret}
								onChange={(event) => setMigrationSecret(event.target.value)}
								disabled={isMigrating}
								className='mt-2 w-full rounded-xl border border-white/15 bg-[#13161b] px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60'
							/>
						</label>
						<div className='flex justify-end gap-3'>
							<button type='button' onClick={closeMigration} disabled={isMigrating} className='min-h-11 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50 cursor-pointer'>Hủy</button>
							<button type='submit' disabled={isMigrating || !migrationSecret.trim()} className='min-h-11 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer'>
								{isMigrating ? 'Đang migrate…' : 'Xác nhận migrate'}
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	)
}
