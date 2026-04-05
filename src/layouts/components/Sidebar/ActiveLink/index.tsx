'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FC, memo, ReactNode } from 'react'
import { FaLock } from 'react-icons/fa6'

interface ActiveLinkProps {
	href: string
	icon: ReactNode
	label: string
	locked?: boolean
	indent?: boolean
}

const ActiveLink: FC<ActiveLinkProps> = ({ href, icon, label, locked, indent }) => {
	const pathname = usePathname()
	const isActive = pathname === href

	return (
		<Link
			href={href}
			className={clsx(
				'flex items-center gap-3 py-2 rounded-lg text-sm transition-colors w-full',
				indent ? 'px-4' : 'px-3',
				isActive
					? 'bg-orange-500/20 text-orange-400'
					: 'text-gray-400 hover:text-white hover:bg-white/5',
			)}>
			<span className='shrink-0 text-base'>{icon}</span>
			<span className='flex-1 font-medium'>{label}</span>
			{locked && <FaLock size={11} className='shrink-0 text-gray-600' />}
		</Link>
	)
}

export default memo(ActiveLink)
