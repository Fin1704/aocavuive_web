'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import CurrencyIcon from '@/components/CurrencyIcon'
import { ReactNode } from 'react'

import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import OceanIntro from '@/components/OceanIntro'
import UserActivity from '@/components/UserActivity'

const AUTH_ROUTES = ['/login', '/register']

const DefaultLayout = ({ children }: { children: ReactNode }) => {
	const pathname = usePathname()

	if (AUTH_ROUTES.includes(pathname)) {
		return <>{children}</>
	}

	const content = (
		<>
			<UserActivity />
			<Header />

			<div className='flex h-[calc(100vh-64px)] bg-darker overflow-hidden'>
				<Sidebar />

				<div className='relative min-w-0 min-h-0 overflow-x-hidden flex-1 overflow-y-auto'>
					<main tabIndex={-1} className='px-4 sm:px-6 pt-6 pb-20 text-white'>
						<Link href='/dashboard' className='mb-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-semidark px-4 py-3 text-sm font-semibold text-orange-300 md:hidden'>
							<CurrencyIcon currency='so' />
							Điểm danh nhận Sò
						</Link>
						{children}
					</main>
				</div>
			</div>
		</>
	)
	return pathname === '/' ? <OceanIntro>{content}</OceanIntro> : content
}

export default DefaultLayout
