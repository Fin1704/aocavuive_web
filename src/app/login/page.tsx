'use client'

import { useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { FaEye, FaEyeSlash, FaFacebookF, FaGoogle, FaUser } from 'react-icons/fa6'
import { z } from 'zod'

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { style } from '@/constants/style'
import { login } from '@/services/authService'
import { AUTH_USER_KEY } from '@/hooks/useAuth'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

const loginSchema = z.object({
	email: z.string().email('Email không hợp lệ'),
	password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: '', password: '' },
	})

	const onSubmit = async (data: LoginFormValues) => {
		try {
			setIsLoading(true)
			const result = await login(data.email, data.password)
			localStorage.setItem('access_token', result.access_token)
			localStorage.setItem('refresh_token', result.refresh_token)
			localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user))
			toast.success('Đăng nhập thành công!')
			router.push('/')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Đăng nhập thất bại')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='flex h-screen w-screen overflow-hidden'>
			{/* Left artwork panel */}
			<div
				className='hidden md:flex flex-1 relative overflow-hidden items-end justify-center'
				style={{
					background:
						'linear-gradient(160deg, #041830 0%, #093060 30%, #0a5080 60%, #0b6e9c 100%)',
				}}>
				<div
					className='absolute inset-0'
					style={{
						background:
							'radial-gradient(ellipse 60% 80% at 50% 20%, rgba(0,180,220,0.18) 0%, transparent 70%)',
					}}
				/>
				<div
					className='absolute inset-0'
					style={{
						background:
							'radial-gradient(ellipse 40% 60% at 30% 60%, rgba(0,100,160,0.25) 0%, transparent 70%)',
					}}
				/>
				{[
					{ left: '15%', top: '70%', size: 8, opacity: 0.3 },
					{ left: '25%', top: '55%', size: 5, opacity: 0.2 },
					{ left: '70%', top: '65%', size: 12, opacity: 0.25 },
					{ left: '80%', top: '80%', size: 6, opacity: 0.2 },
					{ left: '50%', top: '40%', size: 4, opacity: 0.15 },
				].map((b, i) => (
					<div
						key={i}
						className='absolute rounded-full border border-white'
						style={{ left: b.left, top: b.top, width: b.size, height: b.size, opacity: b.opacity }}
					/>
				))}
			</div>

			{/* Right form panel */}
			<div className='flex flex-1 flex-col items-center justify-center bg-[#13161b] relative px-8 py-10'>
				{/* Logo */}
				<div className='absolute top-6 right-8'>
					<Link href='/'>
					<Image
						src='/logo.png'
						alt='Ao Cá Vui Vẻ'
						width={56}
						height={56}
						className='object-contain'
					/>
					</Link>
				</div>

				<div className='w-full max-w-sm space-y-6'>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className='space-y-4'>
							{/* Email */}
							<FormField
								control={form.control}
								name='email'
								render={({ field }) => (
									<FormItem>
										<div className='text-white text-sm font-medium mb-1'>
											Tên đăng nhập
										</div>
										<FormControl>
											<div className='relative'>
												<Input
													type='email'
													placeholder='Tên đăng nhập'
													className='bg-[#1c2030] border-[#2a3348] text-white placeholder:text-gray-600 pr-10 h-12 rounded-lg focus-visible:ring-orange-400 focus-visible:border-orange-400'
													{...field}
												/>
												<FaUser className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm' />
											</div>
										</FormControl>
										<FormMessage className='text-red-400 text-xs' />
									</FormItem>
								)}
							/>

							{/* Password */}
							<FormField
								control={form.control}
								name='password'
								render={({ field }) => (
									<FormItem>
										<div className='text-white text-sm font-medium mb-1'>
											Mật khẩu
										</div>
										<FormControl>
											<div className='relative'>
												<Input
													type={showPassword ? 'text' : 'password'}
													placeholder='Mật khẩu'
													className='bg-[#1c2030] border-[#2a3348] text-white placeholder:text-gray-600 pr-10 h-12 rounded-lg focus-visible:ring-orange-400 focus-visible:border-orange-400'
													{...field}
												/>
												<button
													type='button'
													onClick={() => setShowPassword(!showPassword)}
													className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors'>
													{showPassword ? <FaEyeSlash className='text-sm' /> : <FaEye className='text-sm' />}
												</button>
											</div>
										</FormControl>
										<FormMessage className='text-red-400 text-xs' />
									</FormItem>
								)}
							/>

							{/* Forgot password */}
							<div className='flex justify-end'>
								<Link
									href='#'
									className='text-sm text-orange-400 hover:text-orange-300 transition-colors'>
									Quên mật khẩu?
								</Link>
							</div>

							{/* Submit */}
							<button
								type='submit'
								disabled={isLoading}
								className='w-full h-12 rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed'
								style={{ backgroundImage: style.backgroundImage }}>
								{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
							</button>

							{/* Divider */}
							<div className='flex items-center gap-3 py-1'>
								<div className='flex-1 h-px bg-gray-700' />
								<span className='text-gray-500 text-sm shrink-0'>Hoặc đăng nhập bằng</span>
								<div className='flex-1 h-px bg-gray-700' />
							</div>

							{/* Social login */}
							<div className='flex justify-center gap-4'>
								<button
									type='button'
									onClick={() => toast.info('Đang phát triển!')}
									className='w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors'>
									<FaFacebookF size={18} />
								</button>
								<button
									type='button'
									onClick={() => toast.info('Đang phát triển!')}
									className='w-12 h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors'>
									<FaGoogle size={18} className='text-red-500' />
								</button>
							</div>
						</form>
					</Form>

					{/* Register link */}
					<p className='text-center text-gray-500 text-sm'>
						Bạn chưa có tài khoản?{' '}
						<Link
							href='/register'
							className='text-orange-400 font-semibold hover:text-orange-300 transition-colors'>
							Đăng ký ngay
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}
