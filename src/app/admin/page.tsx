'use client'

import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import moment from 'moment'

import { db } from '@/config/firebase'
import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'
import { ISubscriber } from '@/interfaces/subscriber'
import {
	VipTier,
	getVipTiers,
	createVipTier,
	updateVipTier,
	deleteVipTier,
	setUserExp,
	addUserExp,
} from '@/services/vipService'

export default function AdminPage() {
	const router = useRouter()
	const { isLoggedIn, mounted, isAdmin } = useAuth()

	// VIP tiers state
	const [tiers, setTiers] = useState<VipTier[]>([])
	const [tiersLoading, setTiersLoading] = useState(true)
	const [newVipLevel, setNewVipLevel] = useState('')
	const [newExpRequired, setNewExpRequired] = useState('')
	const [creating, setCreating] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editExpValue, setEditExpValue] = useState('')

	// Exp management state
	const [expUserId, setExpUserId] = useState('')
	const [expAmount, setExpAmount] = useState('')
	const [expLoading, setExpLoading] = useState(false)

	// Subscribers state
	const [subscribers, setSubscribers] = useState<ISubscriber[]>([])
	const [subscribersLoading, setSubscribersLoading] = useState(true)

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) {
			router.replace('/')
		}
	}, [mounted, isLoggedIn, isAdmin, router])

	useEffect(() => {
		if (!mounted || !isAdmin) return
		fetchTiers()
		;(async () => {
			try {
				const snapshot = await getDocs(collection(db, 'subscribers'))
				setSubscribers(snapshot.docs.map((doc) => doc.data()) as ISubscriber[])
			} finally {
				setSubscribersLoading(false)
			}
		})()
	}, [mounted, isAdmin])

	const fetchTiers = async () => {
		setTiersLoading(true)
		try {
			const data = await getVipTiers()
			setTiers(data)
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu VIP')
		} finally {
			setTiersLoading(false)
		}
	}

	const handleCreateTier = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newVipLevel || !newExpRequired) return
		setCreating(true)
		try {
			await createVipTier(Number(newVipLevel), Number(newExpRequired))
			toast.success('Đã tạo VIP tier mới!')
			setNewVipLevel('')
			setNewExpRequired('')
			await fetchTiers()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi tạo VIP tier')
		} finally {
			setCreating(false)
		}
	}

	const handleUpdateTier = async (id: string) => {
		if (!editExpValue) return
		try {
			await updateVipTier(id, Number(editExpValue))
			toast.success('Đã cập nhật VIP tier!')
			setEditingId(null)
			setEditExpValue('')
			await fetchTiers()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật VIP tier')
		}
	}

	const handleDeleteTier = async (id: string, vipLevel: number) => {
		if (!confirm(`Xóa VIP ${vipLevel}?`)) return
		try {
			await deleteVipTier(id)
			toast.success(`Đã xóa VIP ${vipLevel}!`)
			await fetchTiers()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi xóa VIP tier')
		}
	}

	const handleSetExp = async () => {
		if (!expUserId || expAmount === '') return
		setExpLoading(true)
		try {
			await setUserExp(expUserId, Number(expAmount))
			toast.success('Đã đặt exp thành công!')
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi đặt exp')
		} finally {
			setExpLoading(false)
		}
	}

	const handleAddExp = async () => {
		if (!expUserId || expAmount === '') return
		setExpLoading(true)
		try {
			await addUserExp(expUserId, Number(expAmount))
			toast.success('Đã cộng exp thành công!')
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi cộng exp')
		} finally {
			setExpLoading(false)
		}
	}

	if (!mounted || !isLoggedIn || !isAdmin) {
		return null
	}

	return (
		<div
			className='min-h-screen p-6 space-y-8'
			style={{ backgroundColor: '#13161b' }}>
			<h1 className='text-2xl font-bold text-white'>Trang Quản Trị</h1>

			{/* Section 1: VIP Tier Management */}
			<div className='bg-semidark rounded-2xl p-6 space-y-5'>
				<h2 className='text-xl font-bold text-white'>Quản lý mốc VIP</h2>

				{/* Add new tier form */}
				<form
					onSubmit={handleCreateTier}
					className='flex flex-wrap gap-3 items-end'>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>VIP Level</label>
						<input
							type='number'
							min={1}
							value={newVipLevel}
							onChange={(e) => setNewVipLevel(e.target.value)}
							placeholder='VIP Level'
							className='w-32 h-10 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
						/>
					</div>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>Exp Cần</label>
						<input
							type='number'
							min={0}
							value={newExpRequired}
							onChange={(e) => setNewExpRequired(e.target.value)}
							placeholder='Exp cần thiết'
							className='w-40 h-10 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
						/>
					</div>
					<button
						type='submit'
						disabled={creating}
						className='h-10 px-5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60'
						style={{ backgroundImage: style.backgroundImage }}>
						{creating ? 'Đang tạo...' : 'Thêm mốc VIP'}
					</button>
				</form>

				{/* Tiers table */}
				{tiersLoading ? (
					<p className='text-gray-400 text-sm'>Đang tải...</p>
				) : tiers.length === 0 ? (
					<p className='text-gray-400 text-sm'>Chưa có mốc VIP nào.</p>
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full text-sm text-white'>
							<thead>
								<tr className='text-gray-400 border-b border-white/10'>
									<th className='text-left py-2 pr-4'>VIP Level</th>
									<th className='text-left py-2 pr-4'>Exp Cần</th>
									<th className='text-left py-2'>Actions</th>
								</tr>
							</thead>
							<tbody>
								{tiers.map((tier) => (
									<tr
										key={tier.id}
										className='border-b border-white/5 hover:bg-white/5'>
										<td className='py-2 pr-4 font-medium'>VIP {tier.vip_level}</td>
										<td className='py-2 pr-4'>
											{editingId === tier.id ? (
												<input
													type='number'
													min={0}
													value={editExpValue}
													onChange={(e) => setEditExpValue(e.target.value)}
													className='w-32 h-8 rounded-lg bg-[#13161b] border border-white/20 text-white px-2 text-sm focus:outline-none focus:border-white/40'
												/>
											) : (
												tier.exp_required
											)}
										</td>
										<td className='py-2'>
											<div className='flex gap-2'>
												{editingId === tier.id ? (
													<>
														<button
															onClick={() => handleUpdateTier(tier.id)}
															className='px-3 py-1 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90'
															style={{ backgroundImage: style.backgroundImage }}>
															Lưu
														</button>
														<button
															onClick={() => {
																setEditingId(null)
																setEditExpValue('')
															}}
															className='px-3 py-1 rounded-lg text-white text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors'>
															Hủy
														</button>
													</>
												) : (
													<>
														<button
															onClick={() => {
																setEditingId(tier.id)
																setEditExpValue(String(tier.exp_required))
															}}
															className='px-3 py-1 rounded-lg text-white text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors'>
															Sửa
														</button>
														<button
															onClick={() => handleDeleteTier(tier.id, tier.vip_level)}
															className='px-3 py-1 rounded-lg text-red-400 text-xs font-semibold bg-red-400/10 hover:bg-red-400/20 transition-colors'>
															Xóa
														</button>
													</>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Section 2: Exp Management */}
			<div className='bg-semidark rounded-2xl p-6 space-y-5'>
				<h2 className='text-xl font-bold text-white'>Quản lý Exp người dùng</h2>
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
						disabled={expLoading}
						className='h-10 px-5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60'
						style={{ backgroundImage: style.backgroundImage }}>
						Đặt Exp
					</button>
					<button
						onClick={handleAddExp}
						disabled={expLoading}
						className='h-10 px-5 rounded-lg text-white font-semibold text-sm bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-60'>
						Cộng Exp
					</button>
				</div>
			</div>
			{/* Section 3: Subscribers */}
			<div className='bg-semidark rounded-2xl p-6 space-y-5'>
				<h2 className='text-xl font-bold text-white'>
					Subscribers ({subscribers.length})
				</h2>
				{subscribersLoading ? (
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
											{moment(s.createdAt as number).fromNow()}
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
