import { getApiUrl } from '@/config/api'

export interface MigrationResult {
	ran_by_user_id: string
	executed_at: string
}

interface ApiResponse<T> {
	status: 'success' | 'error'
	message?: string
	data?: T
}

export async function runDatabaseMigration(secret: string): Promise<MigrationResult> {
	const token = localStorage.getItem('access_token')
	const response = await fetch(getApiUrl('/admin/migrate/run'), {
		method: 'POST',
		cache: 'no-store',
		headers: {
			Accept: 'application/json',
			Authorization: `Bearer ${token ?? ''}`,
			'X-Migration-Secret': secret,
		},
	})
	const result = await response.json().catch(() => null) as ApiResponse<MigrationResult> | null
	if (!response.ok || result?.status !== 'success' || !result.data) {
		if (response.status === 404) {
			throw new Error('Migration API đang tắt. Hãy cấu hình MIGRATE_SECRET trong .env của Account.')
		}
		if (response.status === 403) {
			throw new Error('Migration secret không đúng hoặc tài khoản không có quyền admin.')
		}
		throw new Error(result?.message || 'Không thể chạy migration database.')
	}
	return result.data
}
