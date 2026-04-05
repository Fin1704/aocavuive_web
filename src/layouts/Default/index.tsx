'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

const AUTH_ROUTES = ['/login', '/register']

const DefaultLayout = ({ children }: { children: ReactNode }) => {
	const pathname = usePathname()

	if (AUTH_ROUTES.includes(pathname)) {
		return <>{children}</>
	}

	return (
		<>
			<Header />

			<div className='flex h-[calc(100vh-64px)] bg-darker overflow-hidden'>
				<Sidebar />

				<div className='relative overflow-x-hidden flex-1 min-h-screen overflow-y-scroll'>
					<main className='px-6 pt-6 pb-20 text-white'>
						{children}
					</main>
				</div>
			</div>
		</>
	)
}

export default DefaultLayout
