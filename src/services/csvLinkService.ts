import { getApiUrl } from '@/config/api'

export interface CsvLink {
	id: string
	key: string
	name: string
	url: string
	description: string | null
	is_active: number
	created_at: string
	updated_at: string
}

export interface PublicCsvLink {
	key: string
	name: string
	url: string
	description: string | null
	updated_at: string
}

export type CreateCsvLinkPayload = {
	key: string
	name: string
	url: string
	description?: string | null
	is_active?: number
}

export type UpdateCsvLinkPayload = Partial<CreateCsvLinkPayload>

interface ApiError {
	status: 'error'
	status_code: number
	message: string
	errors?: Record<string, string[]> | { detail?: string }
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

async function handleResponse<T>(res: Response): Promise<T> {
	const json = await res.json()
	if (!res.ok) {
		const err = json as ApiError
		let message = err.message ?? 'Đã có lỗi xảy ra'
		if (err.errors) {
			if (typeof err.errors === 'object') {
				const errorVals = Object.values(err.errors).flat()
				if (errorVals.length > 0) {
					message = errorVals.join(', ')
				}
			}
		}
		throw new Error(message)
	}
	return json.data as T
}

// Public: Lấy thông tin link CSV theo key
export async function getCsvLinkByKey(key: string): Promise<PublicCsvLink> {
	const res = await fetch(getApiUrl(`/csv-links/${encodeURIComponent(key)}`))
	return handleResponse<PublicCsvLink>(res)
}

// Public: Lấy danh sách tất cả các link CSV đang active
export async function getPublicCsvLinks(): Promise<PublicCsvLink[]> {
	const res = await fetch(getApiUrl('/csv-links'))
	return handleResponse<PublicCsvLink[]>(res)
}

// Admin: Lấy danh sách đầy đủ tất cả link CSV
export async function getAdminCsvLinks(): Promise<CsvLink[]> {
	const res = await fetch(getApiUrl('/admin/csv-links'), {
		headers: authHeaders(),
	})
	return handleResponse<CsvLink[]>(res)
}

// Admin: Tạo link CSV mới
export async function createCsvLink(data: CreateCsvLinkPayload): Promise<CsvLink> {
	const res = await fetch(getApiUrl('/admin/csv-links'), {
		method: 'POST',
		headers: authHeaders(),
		body: JSON.stringify(data),
	})
	return handleResponse<CsvLink>(res)
}

// Admin: Cập nhật link CSV
export async function updateCsvLink(id: string, data: UpdateCsvLinkPayload): Promise<CsvLink> {
	const res = await fetch(getApiUrl(`/admin/csv-links/${id}`), {
		method: 'POST',
		headers: {
			...authHeaders(),
			'X-HTTP-Method-Override': 'PUT',
		},
		body: JSON.stringify(data),
	})
	return handleResponse<CsvLink>(res)
}

// Admin: Xóa link CSV
export async function deleteCsvLink(id: string): Promise<void> {
	const res = await fetch(getApiUrl(`/admin/csv-links/${id}/delete`), {
		method: 'POST',
		headers: {
			...authHeaders(),
			'X-HTTP-Method-Override': 'DELETE',
		},
	})
	await handleResponse<null>(res)
}
