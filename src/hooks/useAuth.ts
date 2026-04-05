'use client'

import { useEffect, useState } from 'react'

import { AuthUser } from '@/services/authService'

export const AUTH_USER_KEY = 'auth_user'

export const useAuth = () => {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		const stored = localStorage.getItem(AUTH_USER_KEY)
		if (stored) {
			try {
				setUser(JSON.parse(stored))
			} catch {
				localStorage.removeItem(AUTH_USER_KEY)
			}
		}
		setMounted(true)
	}, [])

	const logout = () => {
		localStorage.removeItem('access_token')
		localStorage.removeItem('refresh_token')
		localStorage.removeItem(AUTH_USER_KEY)
		setUser(null)
		window.location.href = '/'
	}

	const isAdmin = user?.roles?.some((r) => r.slug === 'admin') ?? false

	return { user, isLoggedIn: mounted && !!user, logout, mounted, isAdmin }
}
