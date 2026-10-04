import { getApiUrl } from '@/config/api'

export interface MigrationResult {
	ran_by_user_id: string
	executed_at: string
}

interface ApiResponse<T> {
	status: 'success' | 'error'
	status_code: number
	message: string
	data?: T
	errors?: Record<string, string[]> | { detail?: string }
}

function getToken(): string | null {
	return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
}

export async function runDatabaseMigration(): Promise<MigrationResult> {
	const token = getToken()
	const res = await fetch(getApiUrl('/admin/migrate/run'), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	})

	const json = (await res.json()) as ApiResponse<MigrationResult>
	if (!res.ok) {
		const detail = (json.errors as { detail?: string })?.detail
		const message = detail ? `${json.message}: ${detail}` : json.message ?? 'Chạy migration thất bại'
		throw new Error(message)
	}

	return json.data as MigrationResult
}
