import { getApiUrl } from '@/config/api'

export interface GameServer {
	id: string
	name: string | null
	server_number: number | null
	url: string
	status: 'online' | 'offline' | 'maintenance'
	ip: string | null
	port: number | null
	note: string | null
	created_at: string
	updated_at: string
}

export type CreateServerPayload = {
	name?: string
	server_number?: number | null
	url: string
	status?: 'online' | 'offline' | 'maintenance'
	ip?: string
	port?: number | null
	note?: string
}

export type UpdateServerPayload = Partial<CreateServerPayload>

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

function authHeaders() {
	const token = getToken()
	return {
		'Content-Type': 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	}
}

// Admin: danh sách đầy đủ (có ip, port, note)
export async function getAdminServers(): Promise<GameServer[]> {
	const res = await fetch(getApiUrl('/admin/servers'), {
		headers: authHeaders(),
	})
	return handleResponse<GameServer[]>(res)
}

// Admin: tạo server mới
export async function createServer(data: CreateServerPayload): Promise<GameServer> {
	const res = await fetch(getApiUrl('/admin/servers'), {
		method: 'POST',
		headers: authHeaders(),
		body: JSON.stringify(data),
	})
	return handleResponse<GameServer>(res)
}

// Admin: cập nhật server
export async function updateServer(id: string, data: UpdateServerPayload): Promise<GameServer> {
	const res = await fetch(getApiUrl(`/admin/servers/${id}`), {
		method: 'PUT',
		headers: authHeaders(),
		body: JSON.stringify(data),
	})
	return handleResponse<GameServer>(res)
}

// Admin: xóa server
export async function deleteServer(id: string): Promise<void> {
	const res = await fetch(getApiUrl(`/admin/servers/${id}`), {
		method: 'DELETE',
		headers: authHeaders(),
	})
	await handleResponse<null>(res)
}
