import { getApiUrl } from '@/config/api'

export interface Post {
	id: string
	title: string
	content: string
	is_live: boolean
	created_at: string
	updated_at: string
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

function authHeaders() {
	const token = getToken()
	return {
		'Content-Type': 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	}
}

// Public: get live posts
export async function getPosts(page = 1, perPage = 5): Promise<{ posts: Post[]; pagination: { total: number; total_pages: number } | null }> {
	const res = await fetch(getApiUrl(`/posts?page=${page}&per_page=${perPage}`), {
		headers: { 'Content-Type': 'application/json' },
	})
	return handleResponse(res)
}

// Admin: get all posts (including drafts)
export async function adminGetPosts(page = 1, perPage = 20): Promise<{ posts: Post[]; pagination: { total: number; total_pages: number } | null }> {
	const res = await fetch(getApiUrl(`/admin/posts?page=${page}&per_page=${perPage}`), {
		headers: authHeaders(),
	})
	return handleResponse(res)
}

// Admin: create post
export async function adminCreatePost(data: { title: string; content?: string; is_live?: boolean }): Promise<Post> {
	const res = await fetch(getApiUrl('/admin/posts'), {
		method: 'POST',
		headers: authHeaders(),
		body: JSON.stringify({ ...data, is_live: data.is_live ? 1 : 0 }),
	})
	return handleResponse<Post>(res)
}

// Admin: update post
export async function adminUpdatePost(id: string, data: { title?: string; content?: string; is_live?: boolean }): Promise<Post> {
	const res = await fetch(getApiUrl(`/admin/posts/${id}`), {
		method: 'PUT',
		headers: authHeaders(),
		body: JSON.stringify({ ...data, ...(data.is_live !== undefined ? { is_live: data.is_live ? 1 : 0 } : {}) }),
	})
	return handleResponse<Post>(res)
}

// Admin: delete post
export async function adminDeletePost(id: string): Promise<void> {
	const res = await fetch(getApiUrl(`/admin/posts/${id}`), {
		method: 'DELETE',
		headers: authHeaders(),
	})
	await handleResponse<null>(res)
}
