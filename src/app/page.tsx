'use client'

import {
	collection,
	doc,
	getCountFromServer,
	getDocs,
	query,
	setDoc,
	where,
} from 'firebase/firestore'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { zodResolver } from '@hookform/resolvers/zod'

import { FaCoins } from 'react-icons/fa6'

import Banner from '@/components/Hero/Banner'
import Discover from '@/components/Discover'
import Leaderboards from '@/components/Leaderboards'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { db } from '@/config/firebase'
import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'
import { IBlog } from '@/interfaces/blog'

const emailSchema = z.object({ email: z.string().email('Email không hợp lệ') })
type EmailForm = z.infer<typeof emailSchema>

const SubscribeCard = () => {
	const [isLoading, setIsLoading] = useState(false)
	const [count, setCount] = useState(0)

	useEffect(() => {
		;(async () => {
			const snapshot = await getCountFromServer(collection(db, 'subscribers'))
			setCount(snapshot.data().count)
		})()
	}, [])

	const form = useForm<EmailForm>({
		resolver: zodResolver(emailSchema),
		defaultValues: { email: '' },
	})

	const onSubmit = async (data: EmailForm) => {
		try {
			setIsLoading(true)
			const usersRef = collection(db, 'subscribers')
			const q = query(usersRef, where('email', '==', data.email))
			const snapshot = await getDocs(q)
			if (!snapshot.empty) {
				toast.error('Email này đã được đăng ký trước!')
				return
			}
			const id = uuidv4()
			await setDoc(doc(usersRef, id), {
				id,
				email: data.email,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			})
			toast.success('Đăng ký thành công!')
			setCount((c) => c + 1)
			form.reset()
		} catch {
			toast.error('Đã có lỗi xảy ra, vui lòng thử lại!')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='rounded-2xl bg-semidark p-5 space-y-3'>
			<div className='space-y-1'>
				<h3 className='text-lg font-bold text-white'>Nhận tin tức mới nhất!</h3>
				<p className='text-gray-400 text-xs leading-relaxed'>
					Nhập email của bạn để không bỏ lỡ bất kỳ sự kiện hay quà tặng nào.
				</p>
				<p className='text-xs text-gray-500'>
					<span className='font-bold text-white'>{count + 47}</span> người đã theo dõi.
				</p>
			</div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-2'>
					<FormField
						control={form.control}
						name='email'
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										type='email'
										placeholder='Nhập email...'
										className='bg-darker border-white/10 text-white placeholder:text-gray-600 h-10'
										{...field}
									/>
								</FormControl>
								<FormMessage className='text-red-400 text-xs' />
							</FormItem>
						)}
					/>
					<button
						type='submit'
						disabled={isLoading}
						className='w-full h-10 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60'
						style={{ backgroundImage: style.backgroundImage }}>
						{isLoading ? 'Đang gửi...' : 'Theo dõi'}
					</button>
				</form>
			</Form>
		</div>
	)
}

const JoinCard = () => (
	<div className='rounded-2xl bg-semidark p-6 space-y-4 text-center'>
		<div className='space-y-1'>
			<h2 className='text-2xl font-bold text-white'>Tham gia ngay!</h2>
			<p className='text-gray-400 text-sm'>Gia nhập cuộc phiêu lưu dưới nước!</p>
		</div>
		<div className='flex gap-3'>
			<Link
				href='/register'
				className='flex-1 py-2.5 rounded-lg text-center font-semibold text-white text-sm transition-opacity hover:opacity-90'
				style={{ backgroundImage: style.backgroundImage }}>
				Đăng ký
			</Link>
			<Link
				href='/login'
				className='flex-1 py-2.5 rounded-lg text-center font-semibold text-white text-sm bg-dark border border-white/15 hover:bg-white/5 transition-colors'>
				Đăng nhập
			</Link>
		</div>
	</div>
)

const AccountOverview = () => {
	const { user } = useAuth()
	const account = user?.account

	return (
		<div className='rounded-2xl bg-semidark p-5 space-y-4'>
			<h3 className='text-base font-bold text-white'>Account Overview</h3>
			<div className='flex justify-between'>
				<div>
					<div className='text-gray-400 text-xs mb-1'>VIP</div>
					<div className='text-2xl font-bold text-white'>
						{account?.vip ? `VIP ${account.vip.vip_level}` : 'Chưa có VIP'}
					</div>
				</div>
				<div className='text-right'>
					<div className='text-gray-400 text-xs mb-1'>Điểm thưởng</div>
					<div className='flex items-center gap-1.5 justify-end'>
						<FaCoins size={16} className='text-yellow-400' />
						<span className='text-2xl font-bold text-white'>{account?.gold ?? 0}</span>
						<span className='text-xs text-yellow-400 font-medium'>Gold</span>
					</div>
				</div>
			</div>
			<button
				onClick={() => toast.info('Coming soon!')}
				className='w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90'
				style={{ backgroundImage: style.backgroundImage }}>
				Nhận thưởng
			</button>
		</div>
	)
}

export default function Home() {
	const { isLoggedIn, mounted } = useAuth()
	const [secondEvent, setSecondEvent] = useState<IBlog | null>(null)

	useEffect(() => {
		;(async () => {
			const snapshot = await getDocs(collection(db, 'blogs'))
			const data = snapshot.docs.map((doc) => doc.data()) as IBlog[]
			if (data.length > 1) setSecondEvent(data[1])
		})()
	}, [])

	return (
		<div className='grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6'>
			{/* Left column */}
			<div className='space-y-4 min-w-0'>
				<h1 className='text-2xl font-semibold text-white'>Trung tâm sự kiện</h1>

				<Banner />

				{secondEvent && (
					<div
						className='relative h-36 rounded-2xl overflow-hidden bg-cover bg-center cursor-pointer'
						style={{
							backgroundImage: `url(${secondEvent.thumbnailURL}?v=${secondEvent.updatedAt || ''})`,
						}}>
						<div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent' />
						<div className='absolute bottom-4 left-4 font-bold text-xl text-white'>
							{secondEvent.title}
						</div>
					</div>
				)}

				<Discover />
			</div>

			{/* Right column */}
			<div className='space-y-4'>
				{mounted && (isLoggedIn ? <AccountOverview /> : <JoinCard />)}
				<Leaderboards />
				<SubscribeCard />
			</div>
		</div>
	)
}
