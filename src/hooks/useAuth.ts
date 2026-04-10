'use client'

import { useEffect, useState } from 'react'

import { AuthUser, getMe, refreshTokens } from '@/services/authService'

export const AUTH_USER_KEY = 'auth_user'

const clearStorage = () => {
	localStorage.removeItem('access_token')
	localStorage.removeItem('refresh_token')
	localStorage.removeItem(AUTH_USER_KEY)
}

export const useAuth = () => {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		const init = async () => {
			const accessToken = localStorage.getItem('access_token')
			const storedRefresh = localStorage.getItem('refresh_token')
			const storedRaw = localStorage.getItem(AUTH_USER_KEY)

			// Không có token → không đăng nhập
			if (!accessToken || !storedRaw) {
				clearStorage()
				setMounted(true)
				return
			}

			try {
				// Token còn hạn → lấy data mới nhất
				const fresh = await getMe(accessToken)
				localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fresh))
				setUser(fresh)
			} catch (err) {
				const isUnauthorized = err instanceof Error && err.message === 'UNAUTHORIZED'

				if (isUnauthorized && storedRefresh) {
					// Token hết hạn → thử refresh
					try {
						const newTokens = await refreshTokens(storedRefresh)
						localStorage.setItem('access_token', newTokens.access_token)
						localStorage.setItem('refresh_token', newTokens.refresh_token)
						localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newTokens.user))
						setUser(newTokens.user)
					} catch {
						// Refresh thất bại → đăng xuất sạch
						clearStorage()
						setUser(null)
					}
				} else if (!isUnauthorized) {
					// Lỗi mạng / server → giữ cache tránh đăng xuất nhầm
					try {
						setUser(JSON.parse(storedRaw))
					} catch {
						clearStorage()
					}
				} else {
					// 401 nhưng không có refresh token
					clearStorage()
					setUser(null)
				}
			} finally {
				setMounted(true)
			}
		}

		init()
	}, [])

	const logout = () => {
		clearStorage()
		setUser(null)
		window.location.href = '/'
	}

	const isAdmin = user?.roles?.some((r) => r.slug === 'admin') ?? false

	return { user, isLoggedIn: mounted && !!user, logout, mounted, isAdmin }
}
