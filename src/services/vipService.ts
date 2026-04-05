import { getApiUrl } from '@/config/api'

export interface VipTier {
	id: string
	vip_level: number
	exp_required: number
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
		const message = err.errors
			? Object.values(err.errors).flat().join(', ')
			: err.message ?? 'Đã có lỗi xảy ra'
		throw new Error(message)
	}
	return json.data as T
}

function getToken(): string | null {
	return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
}

export interface LeaderboardUser {
	user_id: string
	email: string
	avatar_url: string | null
	experience: number
	vip_level: number | null
}

// Get top 5 leaderboard by VIP/experience (public)
export async function getLeaderboard(): Promise<LeaderboardUser[]> {
	const res = await fetch(getApiUrl('/leaderboard'), {
		headers: { 'Content-Type': 'application/json' },
	})
	return handleResponse<LeaderboardUser[]>(res)
}

// Get all VIP tiers (public)
export async function getVipTiers(): Promise<VipTier[]> {
	const res = await fetch(getApiUrl('/vip/tiers'), {
		headers: { 'Content-Type': 'application/json' },
	})
	return handleResponse<VipTier[]>(res)
}

// Admin: create new tier
export async function createVipTier(vip_level: number, exp_required: number): Promise<VipTier> {
	const token = getToken()
	const res = await fetch(getApiUrl('/vip/tiers'), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ vip_level, exp_required }),
	})
	return handleResponse<VipTier>(res)
}

// Admin: update tier exp_required
export async function updateVipTier(id: string, exp_required: number): Promise<VipTier> {
	const token = getToken()
	const res = await fetch(getApiUrl(`/vip/tiers/${id}`), {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ exp_required }),
	})
	return handleResponse<VipTier>(res)
}

// Admin: delete tier
export async function deleteVipTier(id: string): Promise<void> {
	const token = getToken()
	const res = await fetch(getApiUrl(`/vip/tiers/${id}`), {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	})
	await handleResponse<null>(res)
}

// Admin: set exp for user
export async function setUserExp(userId: string, experience: number): Promise<void> {
	const token = getToken()
	const res = await fetch(getApiUrl(`/account/${userId}/exp`), {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ experience }),
	})
	await handleResponse<unknown>(res)
}

// Admin: add exp to user
export async function addUserExp(userId: string, experience: number): Promise<void> {
	const token = getToken()
	const res = await fetch(getApiUrl(`/account/${userId}/exp/add`), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ experience }),
	})
	await handleResponse<unknown>(res)
}
