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
			password: '',
			confirmPassword: '',
			agreeTerms: false,
		},
	})

	const onSubmit = async (data: RegisterFormValues) => {
		try {
			setIsLoading(true)
			await register(data.email, data.password)
			toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.')
			router.push('/dang-nhap')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Đăng ký thất bại')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='flex h-screen w-screen overflow-hidden'>
			{/* Left artwork panel */}
			<div
				className='hidden md:flex flex-1 relative overflow-hidden flex-col items-start justify-start p-8'
				style={{
					background:
						'linear-gradient(160deg, #00b4d8 0%, #0077b6 30%, #023e8a 70%, #03045e 100%)',
				}}>
				<Link href='/'>
					<Image
						src='/logo.png'
						alt='Ao Cá Vui Vẻ'
						width={56}
						height={56}
						className='object-contain relative z-10'
					/>
				</Link>
				<div
					className='absolute inset-0'
					style={{
						background:
							'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(0,220,255,0.2) 0%, transparent 70%)',
					}}
				/>
				<div
					className='absolute inset-0'
					style={{
						background:
							'radial-gradient(ellipse 50% 40% at 80% 30%, rgba(100,220,255,0.15) 0%, transparent 70%)',
					}}
				/>
				{[
					{ left: '10%', top: '60%', size: 10, opacity: 0.35 },
					{ left: '20%', top: '75%', size: 6, opacity: 0.25 },
					{ left: '60%', top: '55%', size: 14, opacity: 0.2 },
					{ left: '75%', top: '70%', size: 8, opacity: 0.25 },
					{ left: '85%', top: '45%', size: 5, opacity: 0.2 },
					{ left: '40%', top: '85%', size: 7, opacity: 0.3 },
				].map((b, i) => (
					<div
						key={i}
						className='absolute rounded-full border border-white'
						style={{ left: b.left, top: b.top, width: b.size, height: b.size, opacity: b.opacity }}
					/>
				))}
			</div>

			{/* Right form panel */}
			<div className='flex flex-1 flex-col items-center justify-center bg-[#13161b] px-8 py-10 overflow-y-auto'>
				<div className='w-full max-w-sm space-y-5'>
					<h1 className='text-white text-2xl font-bold text-center mb-2'>
						Đăng ký tài khoản
					</h1>

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
		</div>
	)
}
