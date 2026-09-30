'use client'

import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import UserAvatar from '@/components/UserAvatar'
import CurrencyBalances from '@/components/CurrencyBalances'

import { Button } from '@/components/ui/button'
import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'

const Header = () => {
	const { user, isLoggedIn, logout, mounted } = useAuth()

	const displayName = user?.username ?? user?.email?.split('@')[0] ?? 'User'

	return (
		<div className='h-16 sticky top-0 left-0 w-full z-20 flex items-center justify-between bg-dark px-2 sm:px-4'>
			<Link href='/'>
				<Image
					src='/logo.png'
					alt='Logo'
					width={50}
					height={50}
				/>
			</Link>

			<div className='flex items-center gap-2 sm:gap-3'>
				<Button
					onClick={() => toast.info('Coming soon!')}
					className='hidden md:inline-flex bg-semidark text-xs md:text-base text-white rounded-full'>
					<Image
						src='/quests-tasks-icon.png'
						alt='Quests Tasks Icon'
						width={40}
						height={40}
						className='w-8 h-8 sm:w-10 sm:h-10 object-contain'
					/>
				</Button>

				{!mounted ? null : isLoggedIn ? (
					<>
						{/* Avatar + info */}
						<div className='flex items-center gap-2 sm:gap-3'>
							<Link href='/settings' aria-label='Thông tin tài khoản'><UserAvatar src={user?.avatar_url} name={displayName} /></Link>

							<div className='min-w-0'>
								<div className='text-white font-semibold text-sm leading-tight truncate max-w-36'>
									{displayName}
								</div>
								<div className='flex items-center gap-2 text-xs text-gray-400'>
									<span className='hidden lg:inline'>{user?.account?.vip ? `VIP ${user.account.vip.vip_level}` : 'Chưa có VIP'}</span>
									<CurrencyBalances account={user?.account} className='text-white font-medium' />
								</div>
							</div>
						</div>

						{/* Logout */}
						<button
							onClick={logout}
							className='px-2 sm:px-4 py-2 text-sm font-semibold text-white rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors'>
							Đăng xuất
						</button>
					</>
				) : (
					<>
						<Link
							href='/login'
							className='px-2 sm:px-4 py-2 text-sm font-semibold text-white rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors'>
							Đăng nhập
						</Link>

						<Link
							href='/register'
							className='px-2 sm:px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90'
							style={{ backgroundImage: style.backgroundImage }}>
							Đăng ký
						</Link>
					</>
				)}
			</div>
		</div>
	)
}

export default Header
