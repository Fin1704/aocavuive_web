import { getApiUrl } from '@/config/api'

export interface AdminUserSummary {
	id: string
	email: string
	username: string | null
	username_changed_at: string | null
	avatar_url: string | null
	is_verified: boolean
	register_ip: string | null
	last_login_ip: string | null
	last_online_at: string | null
	shells: number
	checkin_streak: number
	checkin_best_streak: number
	last_checkin_date: string | null
	created_at: string | null
	updated_at: string | null
}

interface Role {
	id: string
	name: string
	slug: string
	description: string | null
	created_at: string | null
	updated_at: string | null
}

export interface AdminUserDetail extends AdminUserSummary {
	roles: Role[]
	permissions: string[]
	account: {
		id: string
		user_id: string
		gold: number | string
		experience: number | string
		created_at: string | null
		updated_at: string | null
		vip: {
			id: string
			vip_level: number | string
			exp_required: number | string
			created_at: string | null
			updated_at: string | null
		} | null
	} | null
}

export interface AdminUserList {
	users: AdminUserSummary[]
	pagination: { total: number; page: number; per_page: number; pages: number }
}

async function read<T>(path: string, signal: AbortSignal): Promise<T> {
	const token = localStorage.getItem('access_token')
	const response = await fetch(getApiUrl(path), {
		headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		cache: 'no-store', signal,
	})
	const json = await response.json()
	if (!response.ok) throw new Error(json.message ?? 'Không thể tải thông tin người dùng')
	return json.data as T
}

export function listAdminUsers(params: { page: number; q: string; verified: string }, signal: AbortSignal) {
	const query = new URLSearchParams({ page: String(params.page), per_page: '20', q: params.q })
	if (params.verified !== '') query.set('verified', params.verified)
	return read<AdminUserList>(`/admin/users?${query}`, signal)
}

export function getAdminUser(id: string, signal: AbortSignal) {
	return read<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`, signal)
}
