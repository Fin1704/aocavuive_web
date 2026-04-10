'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'
import { setUserExp, addUserExp } from '@/services/vipService'

export default function AdminExpPage() {
	const router = useRouter()
	const { isLoggedIn, mounted, isAdmin } = useAuth()

	const [expUserId, setExpUserId] = useState('')
	const [expAmount, setExpAmount] = useState('')
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) router.replace('/')
	}, [mounted, isLoggedIn, isAdmin, router])

	const handleSetExp = async () => {
		if (!expUserId || expAmount === '') return
		setLoading(true)
		try {
			await setUserExp(expUserId, Number(expAmount))
			toast.success('Đã đặt exp thành công!')
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi đặt exp')
		} finally {
			setLoading(false)
		}
	}

	const handleAddExp = async () => {
		if (!expUserId || expAmount === '') return
		setLoading(true)
		try {
			await addUserExp(expUserId, Number(expAmount))
			toast.success('Đã cộng exp thành công!')
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi cộng exp')
		} finally {
			setLoading(false)
		}
	}

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
				<h1 className='text-2xl font-bold text-white'>Quản lý Exp</h1>
			</div>

			<div className='bg-semidark rounded-2xl p-6 space-y-5'>
				<p className='text-gray-400 text-sm'>
					Nhập User ID và số exp để đặt hoặc cộng exp cho người dùng.
				</p>
				<div className='flex flex-wrap gap-3 items-end'>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>User ID</label>
						<input
							type='text'
							value={expUserId}
							onChange={(e) => setExpUserId(e.target.value)}
							placeholder='UUID của người dùng'
							className='w-72 h-10 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
						/>
					</div>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>Exp</label>
						<input
							type='number'
							min={0}
							value={expAmount}
							onChange={(e) => setExpAmount(e.target.value)}
							placeholder='Số exp'
							className='w-36 h-10 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
						/>
					</div>
					<button
						onClick={handleSetExp}
						disabled={loading}
						className='h-10 px-5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60'
						style={{ backgroundImage: style.backgroundImage }}>
						Đặt Exp
					</button>
					<button
						onClick={handleAddExp}
						disabled={loading}
						className='h-10 px-5 rounded-lg text-white font-semibold text-sm bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-60'>
						Cộng Exp
					</button>
				</div>
			</div>
		</div>
	)
}
