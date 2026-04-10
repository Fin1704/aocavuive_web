'use client'

import {
	FaFacebook,
	FaGear,
	FaNewspaper,
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
		href: '/settings',
		label: 'Cài đặt',
		icon: <FaGear size={16} />,
	},
]

const adminSubPages = [
	{
		href: '/admin',
		label: 'Tổng quan',
		icon: <FaShield size={14} />,
	},
	{
		href: '/admin/blogs',
		label: 'Blogs',
		icon: <FaNewspaper size={14} />,
	},
]

const Sidebar = () => {
	const { isAdmin, isLoggedIn, mounted } = useAuth()

	return (
		<div className='shrink-0 hidden md:flex flex-col justify-between py-4 px-2 w-52 h-full bg-dark border-r border-white/5'>
			<div className='flex flex-col gap-1'>
				{mounted && isAdmin && (
					<div className='flex flex-col gap-0.5'>
						<p className='text-[10px] text-gray-500 uppercase tracking-widest px-3 pt-1 pb-0.5'>
							Admin
						</p>
						{adminSubPages.map((page) => (
							<ActiveLink
								key={page.href}
								href={page.href}
								label={page.label}
								icon={page.icon}
								indent
							/>
						))}
					</div>
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
							'https://www.facebook.com/aocavuive.games',
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
