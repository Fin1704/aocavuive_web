'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FaAt, FaCamera, FaChevronRight, FaKey, FaLock, FaShield, FaUser } from 'react-icons/fa6'

import { style } from '@/constants/style'
import { useAuth, AUTH_USER_KEY } from '@/hooks/useAuth'
import { setOwnUsername } from '@/services/authService'

type Tab = 'account' | 'security'

export default function SettingsPage() {
	const router = useRouter()
	const { user, mounted, isLoggedIn } = useAuth()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [tab, setTab] = useState<Tab>('account')
	const [twoFactor, setTwoFactor] = useState(false)

	// Username state
	const [usernameInput, setUsernameInput] = useState('')
	const [savingUsername, setSavingUsername] = useState(false)

	useEffect(() => {
		if (mounted && !isLoggedIn) router.replace('/login')
	}, [mounted, isLoggedIn, router])

	if (!mounted || !isLoggedIn) return null

	const avatarLetter = (user!.username ?? user!.email).charAt(0).toUpperCase()
	const joinDate = user!.created_at
		? new Date(user!.created_at).toLocaleDateString('vi-VN', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
		  })
		: '—'

	const hasUsername = !!user!.username

	const handleSetUsername = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!usernameInput.trim()) return
		setSavingUsername(true)
		try {
			const updated = await setOwnUsername(usernameInput.trim())
			// Cập nhật localStorage để useAuth lấy data mới
			localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated))
			toast.success('Đặt username thành công!')
			setUsernameInput('')
			// Reload để useAuth re-mount với data mới
			window.location.reload()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi đặt username')
		} finally {
			setSavingUsername(false)
		}
	}

	const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
		{ id: 'account', label: 'Tài khoản', icon: <FaUser size={13} /> },
		{ id: 'security', label: 'Bảo mật', icon: <FaShield size={13} /> },
	]

	return (
		<div className='max-w-xl mx-auto space-y-5'>
			{/* Header */}
			<div>
				<h1 className='text-2xl font-bold text-white'>Cài đặt</h1>
				<p className='text-sm text-gray-500 mt-0.5'>Quản lý tài khoản và bảo mật của bạn</p>
			</div>

			{/* Avatar card */}
			<div className='bg-semidark rounded-2xl p-6 flex items-center gap-5'>
				<div className='relative shrink-0'>
					{user!.avatar_url ? (
						<img
							src={user!.avatar_url}
							alt='avatar'
							className='w-20 h-20 rounded-full object-cover ring-2 ring-white/10'
						/>
					) : (
						<div
							className='w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ring-2 ring-white/10'
							style={{ backgroundImage: style.backgroundImage }}>
							{avatarLetter}
						</div>
					)}
					<button
						onClick={() => fileInputRef.current?.click()}
						className='absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#1e2128] border border-white/15 flex items-center justify-center hover:bg-white/10 transition-colors shadow-lg'>
						<FaCamera size={12} className='text-gray-300' />
					</button>
					<input
						ref={fileInputRef}
						type='file'
						accept='image/*'
						className='hidden'
						onChange={() => toast.info('Coming soon!')}
					/>
				</div>
				<div className='min-w-0'>
					{user!.username ? (
						<p className='font-bold text-white text-lg'>@{user!.username}</p>
					) : (
						<p className='text-gray-500 text-sm italic'>Chưa có username</p>
					)}
					<p className='text-sm text-gray-400 truncate mt-0.5'>{user!.email}</p>
					<p className='text-xs text-gray-600 mt-0.5'>Tham gia {joinDate}</p>
					{user!.roles && user!.roles.length > 0 && (
						<div className='flex flex-wrap gap-1.5 mt-2'>
							{user!.roles.map((r) => (
								<span
									key={r.id}
									className='px-2 py-0.5 rounded-full text-xs font-medium bg-white/8 text-gray-300 border border-white/10'>
									{r.name}
								</span>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Tabs */}
			<div className='flex gap-1 bg-semidark rounded-xl p-1'>
				{TABS.map((t) => (
					<button
						key={t.id}
						onClick={() => setTab(t.id)}
						className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-all ${
							tab === t.id
								? 'bg-[#13161b] text-white shadow-sm'
								: 'text-gray-500 hover:text-gray-300'
						}`}>
						{t.icon}
						{t.label}
					</button>
				))}
			</div>

			{/* Tab: Tài khoản */}
			{tab === 'account' && (
				<div className='space-y-3'>
					{/* Info rows */}
					<div className='bg-semidark rounded-2xl overflow-hidden'>
						<InfoRow label='Email' value={user!.email} />
						<InfoRow label='Ngày tham gia' value={joinDate} />
						<InfoRow label='User ID' value={user!.id} mono />
					</div>

					{/* Username section */}
					<div className='bg-semidark rounded-2xl p-5 space-y-4'>
						<div className='flex items-center gap-3'>
							<div className='w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0'>
								<FaAt size={13} className='text-orange-400' />
							</div>
							<div>
								<p className='text-sm font-semibold text-white'>Username</p>
								<p className='text-xs text-gray-500'>
									{hasUsername
										? 'Đã đặt — không thể thay đổi'
										: 'Chỉ được đặt 1 lần duy nhất'}
								</p>
							</div>
							{hasUsername && (
								<div className='ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8'>
									<FaLock size={10} className='text-gray-500' />
									<span className='text-xs text-gray-400 font-mono'>@{user!.username}</span>
								</div>
							)}
						</div>

						{!hasUsername && (
							<form onSubmit={handleSetUsername} className='space-y-3'>
								<div className='relative'>
									<span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none'>
										@
									</span>
									<input
										type='text'
										value={usernameInput}
										onChange={(e) => setUsernameInput(e.target.value)}
										placeholder='ten_nguoi_dung'
										minLength={3}
										maxLength={50}
										pattern='^[a-zA-Z0-9_]+$'
										className='w-full h-10 rounded-lg bg-[#13161b] border border-white/10 text-white pl-7 pr-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
									/>
								</div>
								<p className='text-xs text-gray-600'>
									3–50 ký tự · Chữ cái, số và dấu gạch dưới (_)
								</p>
								<button
									type='submit'
									disabled={savingUsername || !usernameInput.trim()}
									className='w-full h-10 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50'
									style={{ backgroundImage: style.backgroundImage }}>
									{savingUsername ? 'Đang lưu...' : 'Xác nhận đặt username'}
								</button>
							</form>
						)}
					</div>
				</div>
			)}

			{/* Tab: Bảo mật */}
			{tab === 'security' && (
				<div className='bg-semidark rounded-2xl overflow-hidden'>
					<button
						onClick={() => toast.info('Coming soon!')}
						className='w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5 group'>
						<div className='flex items-center gap-3'>
							<div className='w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center'>
								<FaKey size={13} className='text-gray-400' />
							</div>
							<div className='text-left'>
								<p className='text-sm font-medium text-white'>Đổi mật khẩu</p>
								<p className='text-xs text-gray-500'>Cập nhật mật khẩu đăng nhập</p>
							</div>
						</div>
						<FaChevronRight size={12} className='text-gray-600 group-hover:text-gray-400 transition-colors' />
					</button>

					<div className='flex items-center justify-between px-5 py-4'>
						<div className='flex items-center gap-3'>
							<div className='w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center'>
								<FaShield size={13} className='text-gray-400' />
							</div>
							<div>
								<p className='text-sm font-medium text-white'>Xác thực hai yếu tố</p>
								<p className='text-xs text-gray-500'>Bảo vệ tài khoản thêm một lớp</p>
							</div>
						</div>
						<button
							onClick={() => { setTwoFactor((v) => !v); toast.info('Coming soon!') }}
							className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${twoFactor ? '' : 'bg-white/15'}`}
							style={twoFactor ? { backgroundImage: style.backgroundImage } : {}}>
							<span
								className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${twoFactor ? 'left-6' : 'left-1'}`}
							/>
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
	return (
		<div className='flex items-center justify-between px-5 py-3.5 border-b border-white/5 last:border-0'>
			<span className='text-sm text-gray-400'>{label}</span>
			<span className={`text-sm text-white max-w-[60%] truncate text-right ${mono ? 'font-mono text-xs text-gray-300' : ''}`}>
				{value}
			</span>
		</div>
	)
}
