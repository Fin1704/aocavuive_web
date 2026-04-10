'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaCoins, FaStar, FaBolt, FaTrophy, FaMedal, FaFish, FaCalendarDays } from 'react-icons/fa6'
import moment from 'moment'
import 'moment/locale/vi'

import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'
import { getVipTiers, getLeaderboard, VipTier, LeaderboardUser } from '@/services/vipService'
import { getPosts, Post } from '@/services/postService'

moment.locale('vi')

export default function DashboardPage() {
	const router = useRouter()
	const { user, mounted, isLoggedIn } = useAuth()

	const [tiers, setTiers] = useState<VipTier[]>([])
	const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
	const [posts, setPosts] = useState<Post[]>([])

	useEffect(() => {
		if (mounted && !isLoggedIn) router.replace('/login')
	}, [mounted, isLoggedIn, router])

	useEffect(() => {
		if (!mounted || !isLoggedIn) return
		Promise.all([
			getVipTiers().then(setTiers).catch(() => {}),
			getLeaderboard().then(setLeaderboard).catch(() => {}),
			getPosts(1, 4).then((d) => setPosts(d.posts)).catch(() => {}),
		])
	}, [mounted, isLoggedIn])

	if (!mounted || !isLoggedIn) return null

	const account = user!.account
	const exp = account?.experience ?? 0
	const gold = account?.gold ?? 0
	const currentVip = account?.vip?.vip_level ?? 0

	// Sort tiers ascending
	const sortedTiers = [...tiers].sort((a, b) => a.exp_required - b.exp_required)
	const nextTier = sortedTiers.find((t) => t.exp_required > exp)
	const prevTier = sortedTiers.filter((t) => t.exp_required <= exp).at(-1)

	const expProgress = nextTier
		? Math.min(
				100,
				Math.round(
					((exp - (prevTier?.exp_required ?? 0)) /
						(nextTier.exp_required - (prevTier?.exp_required ?? 0))) *
						100,
				),
		  )
		: 100

	// Find rank of current user
	const myRank = leaderboard.findIndex((u) => u.user_id === user!.id) + 1
	const avatarLetter = user!.email.charAt(0).toUpperCase()

	return (
		<div className='space-y-6'>
			{/* Welcome banner */}
			<div
				className='rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden'
				style={{ backgroundImage: style.backgroundImage }}>
				{/* decorative circles */}
				<div className='absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10' />
				<div className='absolute -right-2 -bottom-10 w-28 h-28 rounded-full bg-white/8' />

				<div className='relative shrink-0 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white ring-2 ring-white/30 overflow-hidden'>
					{user!.avatar_url ? (
						<img src={user!.avatar_url} alt='avatar' className='w-full h-full object-cover' />
					) : (
						avatarLetter
					)}
				</div>
				<div className='relative'>
					<p className='text-white/70 text-sm'>Chào mừng trở lại,</p>
					<p className='text-white font-bold text-xl truncate max-w-[220px]'>{user!.email}</p>
					{currentVip > 0 && (
						<span className='inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold'>
							<FaStar size={10} />
							VIP {currentVip}
						</span>
					)}
				</div>
			</div>

			{/* Stats row */}
			<div className='grid grid-cols-3 gap-3'>
				<StatCard
					icon={<FaCoins size={18} className='text-yellow-400' />}
					label='Gold'
					value={gold.toLocaleString('vi-VN')}
					bg='bg-yellow-400/8'
				/>
				<StatCard
					icon={<FaBolt size={18} className='text-blue-400' />}
					label='Experience'
					value={exp.toLocaleString('vi-VN')}
					bg='bg-blue-400/8'
				/>
				<StatCard
					icon={<FaStar size={18} className='text-orange-400' />}
					label='VIP Level'
					value={currentVip > 0 ? `VIP ${currentVip}` : 'Chưa có'}
					bg='bg-orange-400/8'
				/>
			</div>

			{/* EXP Progress */}
			<div className='bg-semidark rounded-2xl p-5 space-y-3'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<FaBolt size={14} className='text-blue-400' />
						<span className='text-sm font-semibold text-white'>Tiến trình EXP</span>
					</div>
					{nextTier ? (
						<span className='text-xs text-gray-400'>
							Mục tiêu: <span className='text-white font-medium'>VIP {nextTier.vip_level}</span>
						</span>
					) : (
						<span className='text-xs text-green-400 font-medium'>Đã đạt tối đa</span>
					)}
				</div>

				<div className='space-y-1.5'>
					<div className='h-2.5 rounded-full bg-white/8 overflow-hidden'>
						<div
							className='h-full rounded-full transition-all duration-700'
							style={{ width: `${expProgress}%`, backgroundImage: style.backgroundImage }}
						/>
					</div>
					<div className='flex justify-between text-xs text-gray-500'>
						<span>{exp.toLocaleString('vi-VN')} EXP</span>
						{nextTier && <span>{nextTier.exp_required.toLocaleString('vi-VN')} EXP</span>}
					</div>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
				{/* Latest events */}
				<div className='bg-semidark rounded-2xl p-5 space-y-4'>
					<div className='flex items-center gap-2'>
						<FaCalendarDays size={14} className='text-orange-400' />
						<span className='text-sm font-semibold text-white'>Sự kiện mới nhất</span>
					</div>

					{posts.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-6 gap-2'>
							<FaFish size={28} className='text-gray-600' />
							<p className='text-gray-500 text-sm'>Chưa có sự kiện nào</p>
						</div>
					) : (
						<div className='space-y-1'>
							{posts.map((post) => (
								<div
									key={post.id}
									className='flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0'>
									<div
										className='mt-0.5 w-1.5 h-1.5 rounded-full shrink-0'
										style={{ backgroundImage: style.backgroundImage }}
									/>
									<div className='min-w-0 flex-1'>
										<p className='text-sm text-white font-medium truncate'>{post.title}</p>
										{post.content && (
											<p className='text-xs text-gray-500 mt-0.5 line-clamp-1'>{post.content}</p>
										)}
									</div>
									<span className='text-xs text-gray-600 shrink-0 mt-0.5'>
										{moment(post.created_at).fromNow(true)}
									</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Leaderboard snapshot */}
				<div className='bg-semidark rounded-2xl p-5 space-y-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<FaTrophy size={14} className='text-yellow-400' />
							<span className='text-sm font-semibold text-white'>Bảng xếp hạng</span>
						</div>
						{myRank > 0 && (
							<span className='text-xs text-gray-400'>
								Hạng của bạn:{' '}
								<span className='text-white font-semibold'>#{myRank}</span>
							</span>
						)}
					</div>

					{leaderboard.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-6 gap-2'>
							<FaTrophy size={28} className='text-gray-600' />
							<p className='text-gray-500 text-sm'>Chưa có dữ liệu</p>
						</div>
					) : (
						<div className='space-y-1'>
							{leaderboard.slice(0, 5).map((u, i) => {
								const isMe = u.user_id === user!.id
								return (
									<div
										key={u.user_id}
										className={`flex items-center gap-3 py-2 px-2 rounded-xl transition-colors ${isMe ? 'bg-white/8' : 'hover:bg-white/4'}`}>
										<RankBadge rank={i + 1} />
										<div className='w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden'>
											{u.avatar_url ? (
												<img src={u.avatar_url} alt='' className='w-full h-full object-cover' />
											) : (
												u.email.charAt(0).toUpperCase()
											)}
										</div>
										<div className='flex-1 min-w-0'>
											<p className={`text-sm truncate ${isMe ? 'font-semibold text-white' : 'text-gray-300'}`}>
												{isMe ? 'Bạn' : u.email.split('@')[0]}
											</p>
										</div>
										<div className='text-right shrink-0'>
											<p className='text-xs font-semibold text-white'>
												{u.experience.toLocaleString('vi-VN')}
											</p>
											<p className='text-[10px] text-gray-500'>EXP</p>
										</div>
									</div>
								)
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function StatCard({
	icon,
	label,
	value,
	bg,
}: {
	icon: React.ReactNode
	label: string
	value: string
	bg: string
}) {
	return (
		<div className='bg-semidark rounded-2xl p-4 space-y-3'>
			<div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
			<div>
				<p className='text-xs text-gray-500'>{label}</p>
				<p className='text-lg font-bold text-white leading-tight'>{value}</p>
			</div>
		</div>
	)
}

function RankBadge({ rank }: { rank: number }) {
	if (rank === 1)
		return <FaMedal size={16} className='shrink-0 text-yellow-400' />
	if (rank === 2)
		return <FaMedal size={16} className='shrink-0 text-gray-300' />
	if (rank === 3)
		return <FaMedal size={16} className='shrink-0 text-orange-400' />
	return (
		<span className='w-4 text-center text-xs font-semibold text-gray-600 shrink-0'>
			{rank}
		</span>
	)
}
