'use client'

import {
	FaFacebook,
	FaGear,
	FaShield,
	FaStar,
} from 'react-icons/fa6'
import { MdDashboard } from 'react-icons/md'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

import ActiveLink from './ActiveLink'

const publicPages = [
	{
		href: '/',
		label: 'Trung tâm sự kiện',
		icon: <FaStar size={16} />,
	},
]

const authPages = [
	{
		href: '/dashboard',
		label: 'Dashboard',
		icon: <MdDashboard size={18} />,
	},
	{
		href: '/cai-dat',
		label: 'Cài đặt tài khoản',
		icon: <FaGear size={16} />,
	},
]

const Sidebar = () => {
	const { isAdmin, isLoggedIn, mounted } = useAuth()

	return (
		<div className='shrink-0 hidden md:flex flex-col justify-between py-4 px-2 w-52 h-full bg-dark border-r border-white/5'>
			<div className='flex flex-col gap-1'>
				{isAdmin && (
					<ActiveLink
						href='/admin'
						label='Admin'
						icon={<FaShield size={16} />}
					/>
				)}
				{mounted && isLoggedIn && authPages.map((page) => (
					<ActiveLink
						key={page.href}
						{...page}
					/>
				))}
				{publicPages.map((page) => (
					<ActiveLink
						key={page.href}
						{...page}
					/>
				))}
			</div>

			<div className='px-1'>
				<Button
					className='w-full justify-start gap-3 bg-transparent hover:bg-white/5 text-gray-500 hover:text-white px-3'
					onClick={() =>
						window.open(
							'https://www.facebook.com/BachTuocMuoiTieu.MyFish/',
							'_blank',
						)
					}>
					<FaFacebook size={15} />
					<span className='text-sm'>Facebook</span>
				</Button>
			</div>
		</div>
	)
}

export default Sidebar
