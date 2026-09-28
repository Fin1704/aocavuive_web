'use client'

import { usePathname } from 'next/navigation'
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

				<div className='relative overflow-x-hidden flex-1 min-h-screen overflow-y-scroll'>
					<main tabIndex={-1} className='px-6 pt-6 pb-20 text-white'>
						{children}
					</main>
				</div>
			</div>
		</>
	)
	return pathname === '/' ? <OceanIntro>{content}</OceanIntro> : content
}

export default DefaultLayout
