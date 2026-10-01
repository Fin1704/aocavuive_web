import { getApiUrl, getServerUrl } from '@/config/api'

export interface OutfitSkin {
	item_code: string
	slot_code: string
	skin_name: string
	image_path: string
	image_url: string
}
export interface Outfit extends OutfitSkin {
	type_id: 1
	detail_id: number
	color_code: string
	max_enhancement_level: number
}
export interface OutfitCatalog {
	type_id: 1
	character: string
	slots: { code: string; label: string }[]
	items: OutfitSkin[]
}
export interface OutfitSnapshot { version: 1; total: number; items: Outfit[] }
export type CreateOutfit = Pick<Outfit, 'type_id' | 'slot_code' | 'skin_name' | 'color_code'>

// Mọi thao tác quản trị đi qua Account và được kiểm tra quyền admin ở API.
async function request<T>(path: string, body?: CreateOutfit, signal?: AbortSignal): Promise<T> {
	const token = localStorage.getItem('access_token')
	const response = await fetch(getApiUrl(`/admin/outfits${path}`), {
		method: body ? 'POST' : 'GET', signal, cache: 'no-store',
		headers: { 'Content-Type': 'application/json', 'Accept-Language': 'vi', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		...(body ? { body: JSON.stringify(body) } : {}),
	})
	const result = await response.json().catch(() => null)
	if (!response.ok || result?.status !== 'success') {
		throw new Error(result?.errors ? Object.values(result.errors).flat().join(', ') : result?.message || 'Không thể tải dữ liệu trang phục.')
	}
	return result.data as T
}

export const getOutfits = (signal?: AbortSignal) => request<OutfitSnapshot>('', undefined, signal)
export const getOutfitCatalog = (signal?: AbortSignal) => request<OutfitCatalog>('/catalog', undefined, signal)
export const createOutfit = (body: CreateOutfit) => request<Outfit>('', body)

export function getSkinImageUrl(item: { image_url?: string; image_path?: string } | null | undefined): string {
	if (!item) return ''
	const raw = item.image_url || item.image_path || ''
	if (!raw) return ''
	const base = getServerUrl().replace(/\/+$/, '')
	if (raw.startsWith('http://') || raw.startsWith('https://')) {
		try {
			const parsed = new URL(raw)
			return `${base}${parsed.pathname}${parsed.search}`
		} catch {
			return raw
		}
	}
	const path = raw.startsWith('/') ? raw : `/${raw}`
	return `${base}${path}`
}
