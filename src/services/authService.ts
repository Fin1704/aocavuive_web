import { getApiUrl } from '@/config/api'

export interface UserAccount {
	id: string
	user_id: string
	gold: number
	experience: number
	vip: { id: string; vip_level: number; exp_required: number } | null
	created_at: string
	updated_at: string
}

export interface AuthUser {
	id: string
	email: string
	username: string | null
	username_changed_at: string | null
	avatar_url: string | null
	is_verified: boolean
	created_at: string
	updated_at: string
	roles: { id: string; slug: string; name: string }[]
	account: UserAccount | null
}

export interface LoginResponse {
	access_token: string
	refresh_token: string
	token_type: string
	expires_in: number
	user: AuthUser
}

export interface RegisterResponse {
	user: AuthUser
	verification_token: string
}

interface ApiError {
	status: 'error'
	status_code: number
	message: string
	errors?: Record<string, string[]>
}

async function handleResponse<T>(res: Response): Promise<T> {
	const json = await res.json()
	if (!res.ok) {
		const err = json as ApiError
		const message =
			err.errors
				? Object.values(err.errors).flat().join(', ')
				: err.message ?? 'Đã có lỗi xảy ra'
		throw new Error(message)
	}
	return json.data as T
}

export async function login(email: string, password: string): Promise<LoginResponse> {
	const res = await fetch(getApiUrl('/auth/login'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	})
	return handleResponse<LoginResponse>(res)
}

export async function getAccount(): Promise<UserAccount> {
	const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
	const res = await fetch(getApiUrl('/account/me'), {
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	})
	return handleResponse<UserAccount>(res)
}

export async function getMe(token: string): Promise<AuthUser> {
	const res = await fetch(getApiUrl('/users/me'), {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
	})
	if (res.status === 401) throw new Error('UNAUTHORIZED')
	return handleResponse<AuthUser>(res)
}

export async function setOwnUsername(username: string): Promise<AuthUser> {
	const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
	const res = await fetch(getApiUrl('/users/me/username'), {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ username }),
	})
	return handleResponse<AuthUser>(res)
}

export async function adminSetUsername(userId: string, username: string): Promise<AuthUser> {
	const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
	const res = await fetch(getApiUrl(`/users/${userId}/username`), {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ username }),
	})
	return handleResponse<AuthUser>(res)
}

export async function refreshTokens(refreshToken: string): Promise<LoginResponse> {
	const res = await fetch(getApiUrl('/auth/refresh'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refresh_token: refreshToken }),
	})
	if (!res.ok) throw new Error('REFRESH_FAILED')
	const json = await res.json()
	return json.data as LoginResponse
}

export async function register(email: string, password: string, username?: string): Promise<RegisterResponse> {
	const res = await fetch(getApiUrl('/auth/register'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password, ...(username ? { username } : {}) }),
	})
	return handleResponse<RegisterResponse>(res)
}
