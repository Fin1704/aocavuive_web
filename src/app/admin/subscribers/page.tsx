'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { collection, getDocs } from 'firebase/firestore'
import moment from 'moment'

import { useAuth } from '@/hooks/useAuth'
import { db } from '@/config/firebase'
import { ISubscriber } from '@/interfaces/subscriber'

export default function AdminSubscribersPage() {
	const router = useRouter()
	const { isLoggedIn, mounted, isAdmin } = useAuth()

	const [subscribers, setSubscribers] = useState<ISubscriber[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) router.replace('/')
	}, [mounted, isLoggedIn, isAdmin, router])

	useEffect(() => {
		if (!mounted || !isAdmin) return
		;(async () => {
			try {
				const snapshot = await getDocs(collection(db, 'subscribers'))
				setSubscribers(snapshot.docs.map((doc) => doc.data()) as ISubscriber[])
			} catch {
				toast.error('Lỗi tải subscribers')
			} finally {
				setLoading(false)
			}
		})()
	}, [mounted, isAdmin])

	if (!mounted || !isLoggedIn || !isAdmin) return null

	return (
		<div
			className='min-h-screen p-6 space-y-6'
			style={{ backgroundColor: '#13161b' }}>
			<div className='flex items-center gap-3'>
				<Link
					href='/admin'
					className='text-gray-400 hover:text-white transition-colors text-sm'>
					← Quản trị
				</Link>
				<span className='text-gray-600'>/</span>
				<h1 className='text-2xl font-bold text-white'>
					Subscribers {!loading && `(${subscribers.length})`}
				</h1>
			</div>

			<div className='bg-semidark rounded-2xl p-6'>
				{loading ? (
					<p className='text-gray-400 text-sm'>Đang tải...</p>
				) : subscribers.length === 0 ? (
					<p className='text-gray-400 text-sm'>Chưa có subscriber nào.</p>
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full text-sm text-white'>
							<thead>
								<tr className='text-gray-400 border-b border-white/10'>
									<th className='text-left py-2 pr-4'>Email</th>
									<th className='text-left py-2 pr-4'>IP</th>
									<th className='text-left py-2 pr-4'>Language</th>
									<th className='text-left py-2 pr-4'>Screen</th>
									<th className='text-left py-2'>Đăng ký</th>
								</tr>
							</thead>
							<tbody>
								{subscribers.map((s) => (
									<tr
										key={s.id}
										className='border-b border-white/5 hover:bg-white/5'>
										<td className='py-2 pr-4'>{s.email}</td>
										<td className='py-2 pr-4 text-gray-400'>{s.ipAddress ?? '—'}</td>
										<td className='py-2 pr-4 text-gray-400'>{s.language ?? '—'}</td>
										<td className='py-2 pr-4 text-gray-400'>
											{s.screenWidth && s.screenHeight
												? `${s.screenWidth}×${s.screenHeight}`
												: '—'}
										</td>
										<td className='py-2 text-gray-400'>
											{moment(s.createdAt as unknown as number).fromNow()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}
