import { getApiUrl } from '@/config/api'
import { refreshTokens } from './authService'

export interface CheckInStatus {
	shells: number
	streak: number
	best_streak: number
	last_checkin_date: string | null
	checked_in_today: boolean
	today_reward: number | null
	date: string
	timezone: string
	server_time: string
	next_reset_at: string
	reward_min: number
	reward_max: number
	recent_checkins: { checkin_date: string; reward: number; streak: number }[]
}
export interface CheckInResult extends CheckInStatus { claimed: boolean }

export async function accountRequest<T>(path: string, method: 'GET' | 'POST', signal: AbortSignal): Promise<T> {
	let token = localStorage.getItem('access_token')
	if (!token) throw new Error('Bạn cần đăng nhập để tiếp tục.')
	const send = () => fetch(getApiUrl(path), { method, signal, cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
	let response = await send()
	if (response.status === 401 && localStorage.getItem('access_token') !== token) {
		token = localStorage.getItem('access_token')
		if (!token) throw new Error('Phiên đăng nhập đã kết thúc.')
		response = await send()
	}
	if (response.status === 401) {
		const refresh = localStorage.getItem('refresh_token')
		if (!refresh) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
		try {
			const tokens = await refreshTokens(refresh)
			token = tokens.access_token
			localStorage.setItem('access_token', token)
			localStorage.setItem('refresh_token', tokens.refresh_token)
			signal.throwIfAborted()
		} catch (error) {
			if (signal.aborted) throw error
			throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
		}
		response = await send()
	}
	const payload = await response.json().catch(() => null)
	if (!response.ok) throw new Error(payload?.message ?? 'Không thể kết nối Ao Cá. Bạn thử lại nhé!')
	return payload.data as T
}

export const getCheckIn = (signal: AbortSignal) => accountRequest<CheckInStatus>('/account/check-in', 'GET', signal)
export const claimCheckIn = (signal: AbortSignal) => accountRequest<CheckInResult>('/account/check-in', 'POST', signal)
