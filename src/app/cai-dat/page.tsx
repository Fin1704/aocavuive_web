'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FaCamera } from 'react-icons/fa6'

import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'

export default function AccountSettingsPage() {
	const router = useRouter()
	const { user, mounted, isLoggedIn } = useAuth()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [twoFactor, setTwoFactor] = useState(false)

	useEffect(() => {
		if (mounted && !isLoggedIn) router.replace('/login')
	}, [mounted, isLoggedIn, router])

	if (!mounted || !isLoggedIn) return null

	const avatarLetter = user?.email?.charAt(0).toUpperCase() ?? 'U'

	return (
		<div className='space-y-6'>
			<h1 className='text-2xl font-bold text-white'>Cài đặt tài khoản</h1>

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
				{/* Thông tin cá nhân */}
				<div className='bg-semidark rounded-2xl p-6 space-y-5'>
					<h2 className='text-lg font-bold text-white'>Thông tin cá nhân</h2>

					<div className='flex flex-col items-start gap-1'>
						<p className='text-xs text-gray-400'>Avatar</p>
						<div className='relative w-20 h-20'>
							{user?.avatar_url ? (
								<img
									src={user.avatar_url}
									alt='avatar'
									className='w-20 h-20 rounded-full object-cover'
								/>
							) : (
								<div
									className='w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white'
									style={{ backgroundImage: style.backgroundImage }}>
									{avatarLetter}
								</div>
							)}
							<button
								onClick={() => fileInputRef.current?.click()}
								className='absolute bottom-0 right-0 w-7 h-7 rounded-full bg-dark border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors'>
								<FaCamera size={12} className='text-white' />
							</button>
							<input
								ref={fileInputRef}
								type='file'
								accept='image/*'
								className='hidden'
								onChange={() => toast.info('Coming soon!')}
							/>
						</div>
					</div>

					<div className='space-y-1'>
						<p className='text-xs text-gray-400'>Email</p>
						<input
							type='email'
							value={user?.email ?? ''}
							readOnly
							className='w-full h-11 rounded-lg bg-darker border border-white/10 text-white px-3 text-sm focus:outline-none cursor-default'
						/>
					</div>

					<div className='space-y-1'>
						<p className='text-xs text-gray-400'>Ngày tạo tài khoản</p>
						<input
							type='text'
							value={user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
							readOnly
							className='w-full h-11 rounded-lg bg-darker border border-white/10 text-white px-3 text-sm focus:outline-none cursor-default'
						/>
					</div>
				</div>

				{/* Bảo mật */}
				<div className='bg-semidark rounded-2xl p-6 space-y-5'>
					<h2 className='text-lg font-bold text-white'>Bảo mật</h2>

					<button
						onClick={() => toast.info('Coming soon!')}
						className='w-full h-11 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90'
						style={{ backgroundImage: style.backgroundImage }}>
						Đổi mật khẩu
					</button>

					<div className='flex items-center justify-between'>
						<span className='text-sm text-white'>Xác thực hai yếu tố</span>
						<button
							onClick={() => setTwoFactor((v) => !v)}
							className={`relative w-12 h-6 rounded-full transition-colors ${twoFactor ? 'bg-orange-500' : 'bg-white/20'}`}>
							<span
								className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${twoFactor ? 'left-7' : 'left-1'}`}
							/>
						</button>
					</div>
				</div>
			</div>

			<button
				onClick={() => toast.success('Đã lưu thay đổi!')}
				className='w-full h-12 rounded-2xl text-white font-bold text-base transition-opacity hover:opacity-90'
				style={{ backgroundImage: style.backgroundImage }}>
				Lưu thay đổi
			</button>
		</div>
	)
}
