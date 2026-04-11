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
	const [showVerifyPopup, setShowVerifyPopup] = useState(false)
	const router = useRouter()
	const supportFacebookUrl = 'https://www.facebook.com'

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
			const isEmailNotVerified =
				error &&
				typeof error === 'object' &&
				'message_key' in error &&
				(error as { message_key?: string }).message_key === 'auth.email_not_verified'
			if (isEmailNotVerified) {
				setShowVerifyPopup(true)
			} else {
				toast.error(error instanceof Error ? error.message : 'Đăng nhập thất bại')
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div
			className='min-h-screen w-screen flex items-center justify-center px-6 py-10 overflow-hidden'
			style={{
				background:
					'linear-gradient(160deg, #041830 0%, #0b2b4f 30%, #0a4b75 60%, #0b6e9c 100%)',
			}}>
			<div className='relative w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-[#12151b]/90 p-8 shadow-2xl backdrop-blur-sm'>
				{/* Logo */}
				<div className='flex justify-center'>
					<Link href='/'>
						<Image
							src='/logo.png'
							alt='Ao Cá Vui Vẻ'
							width={64}
							height={64}
							className='object-contain'
						/>
					</Link>
				</div>

				<div className='text-center space-y-1'>
					<h1 className='text-white text-2xl font-semibold'>Đăng nhập</h1>
					<p className='text-sm text-white/60'>Quản lý tài khoản và theo dõi sự kiện của bạn.</p>
				</div>

				<div className='w-full space-y-6'>
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

			{showVerifyPopup && (
				<div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
					<div className='absolute inset-0 bg-black/60 backdrop-blur-sm' />
					<div className='relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#12151b] p-6 shadow-2xl'>
						<button
							type='button'
							onClick={() => setShowVerifyPopup(false)}
							className='absolute right-4 top-4 text-gray-400 hover:text-white transition-colors'
							aria-label='Đóng'>
							×
						</button>
						<h2 className='text-white text-xl font-semibold'>Xác minh tài khoản</h2>
						<p className='mt-2 text-sm text-white/70'>
							Vui lòng xác minh tài khoản bằng link chúng tôi cung cấp trong email.
						</p>
						<div className='mt-5'>
							<a
								href={supportFacebookUrl}
								target='_blank'
								rel='noreferrer'
								className='inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors'>
								Liên hệ Facebook
							</a>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
