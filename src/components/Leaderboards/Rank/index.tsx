import clsx from 'clsx'
import Image from 'next/image'
import CurrencyIcon from '@/components/CurrencyIcon'
import { FC, memo } from 'react'
import { GiTrophy } from 'react-icons/gi'

interface RankProps {
	photoURL: string | null
	displayName: string
	shells: number
	index: number
}

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=random&size=48'

const Rank: FC<RankProps> = ({ photoURL, displayName, shells, index }) => {
	return (
		<div
			className={clsx('relative flex gap-4 p-2 rounded-sm', {
				'bg-[rgba(255,180,68,.3)]': index === 1,
				'bg-[rgba(180,188,203,.3)]': index === 2,
				'bg-[rgba(166,100,79,.3)]': index === 3,
			})}>
			{index <= 3 && (
				<div
					className={clsx(
						'h-6 rounded-r-md w-1 absolute top-1/2 -translate-y-1/2 left-0',
						{
							'bg-[rgb(255,180,68)]': index === 1,
							'bg-[rgb(180,188,203)]': index === 2,
							'bg-[rgb(166,100,79)]': index === 3,
						},
					)}></div>
			)}

			<div className='shrink-0 w-10 h-10 flex items-center justify-center'>
				{index <= 3 ? (
					<GiTrophy
						size={20}
						className={clsx({
							'text-[rgb(255,180,68)]': index === 1,
							'text-[rgb(180,188,203)]': index === 2,
							'text-[rgb(166,100,79)]': index === 3,
						})}
					/>
				) : (
					<span className='text-gray-300'>{index}</span>
				)}
			</div>

			<div className='min-w-0 flex-1 flex items-center gap-3'>
				<Image
					src={photoURL || `${DEFAULT_AVATAR}&name=${encodeURIComponent(displayName)}`}
					alt={displayName}
					width={32}
					height={32}
					className='rounded-full object-cover w-8 h-8'
					unoptimized
				/>

				<div className='truncate'>{displayName}</div>
			</div>

            <div className='shrink-0 w-24 h-10 flex items-center justify-end gap-1.5' aria-label={`${shells.toLocaleString('vi-VN')} Sò`}>
                <span className='text-yellow-400 font-semibold text-sm tabular-nums'>{shells.toLocaleString('vi-VN')}</span>
                <CurrencyIcon currency='so' size={18} />
            </div>
		</div>
	)
}

export default memo(Rank)
