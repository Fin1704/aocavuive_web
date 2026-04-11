'use client'

import { useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { FaEye, FaEyeSlash } from 'react-icons/fa6'
import { z } from 'zod'

import { Checkbox } from '@/components/ui/checkbox'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { style } from '@/constants/style'
import { register } from '@/services/authService'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

const registerSchema = z
	.object({
		email: z.string().email('Email không hợp lệ'),
		username: z
			.string()
			.refine(
				(v) => v === '' || (v.length >= 3 && v.length <= 50 && /^[a-zA-Z0-9_]+$/.test(v)),
				{ message: 'Username 3–50 ký tự, chỉ chữ cái, số và dấu _' },
			),
		password: z
			.string()
			.min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
			.max(20, 'Mật khẩu tối đa 20 ký tự'),
		confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
		agreeTerms: z.boolean().refine((v) => v === true, {
			message: 'Bạn phải đồng ý với điều khoản',
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Mật khẩu xác nhận không khớp',
		path: ['confirmPassword'],
	})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const form = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			email: '',
			username: '',
			password: '',
			confirmPassword: '',
			agreeTerms: false,
		},
	})

	const onSubmit = async (data: RegisterFormValues) => {
		try {
			setIsLoading(true)
			await register(data.email, data.password, data.username || undefined)
			toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.')
			router.push('/login')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Đăng ký thất bại')
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
			<div className='relative w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#12151b]/90 p-8 shadow-2xl backdrop-blur-sm'>
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
					<h1 className='text-white text-2xl font-semibold'>Đăng ký tài khoản</h1>
					<p className='text-sm text-white/60'>Tạo tài khoản để bắt đầu hành trình của bạn.</p>
				</div>

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
										<div className='text-white text-sm font-medium mb-1'>Email</div>
										<FormControl>
											<Input
												type='email'
												placeholder='Email'
												className='bg-[#1c2030] border-[#2a3348] text-white placeholder:text-gray-600 h-12 rounded-lg focus-visible:ring-orange-400 focus-visible:border-orange-400'
												{...field}
											/>
										</FormControl>
										<FormMessage className='text-red-400 text-xs' />
									</FormItem>
								)}
							/>

							{/* Username (optional) */}
							<FormField
								control={form.control}
								name='username'
								render={({ field }) => (
									<FormItem>
										<div className='flex items-center justify-between mb-1'>
											<span className='text-white text-sm font-medium'>Username</span>
											<span className='text-xs text-gray-500'>Tùy chọn</span>
										</div>
										<FormControl>
											<div className='relative'>
												<span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none'>
													@
												</span>
												<Input
													type='text'
													placeholder='ten_cua_ban'
													className='bg-[#1c2030] border-[#2a3348] text-white placeholder:text-gray-600 h-12 rounded-lg pl-7 focus-visible:ring-orange-400 focus-visible:border-orange-400'
													{...field}
												/>
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
										<div className='text-white text-sm font-medium mb-1'>Mật khẩu</div>
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

							{/* Confirm password */}
							<FormField
								control={form.control}
								name='confirmPassword'
								render={({ field }) => (
									<FormItem>
										<div className='text-white text-sm font-medium mb-1'>Xác nhận mật khẩu</div>
										<FormControl>
											<div className='relative'>
												<Input
													type={showConfirm ? 'text' : 'password'}
													placeholder='Xác nhận mật khẩu'
													className='bg-[#1c2030] border-[#2a3348] text-white placeholder:text-gray-600 pr-10 h-12 rounded-lg focus-visible:ring-orange-400 focus-visible:border-orange-400'
													{...field}
												/>
												<button
													type='button'
													onClick={() => setShowConfirm(!showConfirm)}
													className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors'>
													{showConfirm ? <FaEyeSlash className='text-sm' /> : <FaEye className='text-sm' />}
												</button>
											</div>
										</FormControl>
										<FormMessage className='text-red-400 text-xs' />
									</FormItem>
								)}
							/>

							{/* Terms */}
							<FormField
								control={form.control}
								name='agreeTerms'
								render={({ field }) => (
									<FormItem>
										<div className='flex items-center gap-2'>
											<FormControl>
												<Checkbox
													id='terms'
													checked={field.value}
													onCheckedChange={field.onChange}
													className='border-gray-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500'
												/>
											</FormControl>
											<label
												htmlFor='terms'
												className='text-sm text-gray-400 leading-none cursor-pointer select-none'>
												Tôi đồng ý với{' '}
												<Link href='#' className='text-orange-400 hover:text-orange-300 transition-colors'>
													Điều khoản &amp; Điều kiện
												</Link>
											</label>
										</div>
										<FormMessage className='text-red-400 text-xs' />
									</FormItem>
								)}
							/>

							{/* Submit */}
							<button
								type='submit'
								disabled={isLoading}
								className='w-full h-12 rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed mt-2'
								style={{ backgroundImage: style.backgroundImage }}>
								{isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
							</button>
						</form>
				</Form>

				{/* Login link */}
				<p className='text-center text-gray-500 text-sm'>
					Bạn đã có tài khoản?{' '}
					<Link
						href='/login'
						className='text-orange-400 font-semibold hover:text-orange-300 transition-colors'>
						Đăng nhập
					</Link>
				</p>
			</div>
		</div>
	)
}
