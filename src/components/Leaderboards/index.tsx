'use client'

import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { animation } from '@/constants/animation'
import { getLeaderboard, LeaderboardUser } from '@/services/vipService'

import Rank from './Rank'

const Leaderboards = () => {
	const [top, setTop] = useState<LeaderboardUser[]>([])

	useEffect(() => {
		getLeaderboard().then(setTop).catch(console.error)
	}, [])

	return (
		<div className='space-y-4'>
			<motion.div
				{...animation.fromBot}
				className='text-xl font-semibold'>
				Bảng xếp hạng
			</motion.div>

			<motion.div
				{...animation.fromBot}
				className='p-4 bg-semidark rounded-2xl space-y-1'>
				<div className='flex gap-4 mb-4 px-2'>
					<div className='shrink-0 uppercase font-semibold text-sm text-gray-300 w-10'>
						Rank
					</div>

					<div className='flex-1 uppercase font-semibold text-sm text-gray-300'>
						Player
					</div>

					<div className='shrink-0 uppercase font-semibold text-sm text-gray-300 w-14'>
						VIP
					</div>
				</div>

				{top.map((user, i) => (
					<Rank
						key={user.user_id}
						index={i + 1}
						photoURL={user.avatar_url}
						displayName={user.email.split('@')[0]}
						vip_level={user.vip_level}
					/>
				))}
			</motion.div>
		</div>
	)
}

export default Leaderboards
