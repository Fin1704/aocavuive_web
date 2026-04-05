'use client'

import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { FaCoins } from 'react-icons/fa6'

import { Button } from '@/components/ui/button'
import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'

const Header = () => {
	const { user, isLoggedIn, logout, mounted } = useAuth()

	const displayName = user?.email?.split('@')[0] ?? 'User'

	return (
		<div className='h-16 sticky top-0 left-0 w-full z-20 flex items-center justify-between bg-dark px-4'>
			<Link href='/'>
				<Image
					src='/logo.png'
					alt='Logo'
					width={50}
					height={50}
				/>
			</Link>

			<div className='flex items-center gap-3'>
				<Button
					onClick={() => toast.info('Coming soon!')}
					className='bg-semidark text-xs md:text-base text-white rounded-full'>
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
						<div className='flex items-center gap-3'>
							<div className='w-10 h-10 rounded-full overflow-hidden bg-semidark shrink-0'>
								{user?.avatar_url ? (
									<Image
										src={user.avatar_url}
										alt={displayName}
										width={40}
										height={40}
										className='w-full h-full object-cover'
									/>
								) : (
									<div
										className='w-full h-full flex items-center justify-center text-white font-bold text-sm'
										style={{ backgroundImage: style.backgroundImage }}>
										{displayName[0].toUpperCase()}
									</div>
								)}
							</div>

							<div className='hidden md:block'>
								<div className='text-white font-semibold text-sm leading-tight'>
									{displayName}
								</div>
								<div className='flex items-center gap-2 text-xs text-gray-400'>
									<span>{user?.account?.vip ? `VIP ${user.account.vip.vip_level}` : 'Chưa có VIP'}</span>
									<span className='flex items-center gap-1'>
										<FaCoins size={11} className='text-yellow-400' />
										<span className='text-white font-medium'>{user?.account?.gold ?? 0} Gold</span>
									</span>
								</div>
							</div>
						</div>

						{/* Logout */}
						<button
							onClick={logout}
							className='px-4 py-2 text-sm font-semibold text-white rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors'>
							Đăng xuất
						</button>
					</>
				) : (
					<>
						<Link
							href='/login'
							className='px-4 py-2 text-sm font-semibold text-white rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors'>
							Đăng nhập
						</Link>

						<Link
							href='/register'
							className='px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90'
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
