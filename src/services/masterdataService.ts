import { getApiUrl } from '@/config/api'

export interface MasterdataTarget {
 server_id: string
 callback_url: string
 desired_revision: number
 applied_revision: number
 attempts: number
 next_attempt_at: string
 last_error: string | null
}
export interface MasterdataStatus { latest_revision: number; servers: MasterdataTarget[] }
export interface MasterdataDelivery { server_id: string; revision: number; applied: boolean }
export interface MasterdataPublication { revision: number; sha256: string; targets: number; deliveries: MasterdataDelivery[] }

const errors: Record<string, string> = {
 invalid_masterdata_target: 'Không thể đăng ký. Kiểm tra địa chỉ HTTPS, server đã tồn tại và khóa kết nối đã cấu hình trên Account.',
 masterdata_sync_unavailable: 'Chưa thể gửi cập nhật. Kiểm tra server đã đăng ký, có bản phát hành và khóa kết nối hợp lệ.',
 publication_failed: 'Không thể phát hành master. Kiểm tra dịch vụ Account và dữ liệu catalog.',
}

async function request<T>(path: string, method: 'GET' | 'POST' | 'PUT' = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
 const token = localStorage.getItem('access_token')
 if (!token) throw new Error('Vui lòng đăng nhập lại bằng tài khoản quản trị.')
 const controller = new AbortController()
 const abort = () => controller.abort()
 if (signal?.aborted) controller.abort()
 signal?.addEventListener('abort', abort, { once: true })
 let timedOut = false
 const timer = setTimeout(() => { timedOut = true; controller.abort() }, 25000)
 try {
  const response = await fetch(getApiUrl(`/admin/masterdata${path}`), {
   method, cache: 'no-store', signal: controller.signal,
   headers: { 'Content-Type': 'application/json', 'Accept-Language': 'vi', Authorization: `Bearer ${token}` },
   ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const result = await response.json().catch(() => null)
  if (!response.ok || result?.status !== 'success') {
   if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
   if (response.status === 403) throw new Error('Bạn không có quyền quản lý master data.')
   if (response.status === 404) throw new Error('Account chưa có API phát hành master. Cần cập nhật Account trước.')
   throw new Error(errors[result?.error] || result?.message || 'Không thể thực hiện yêu cầu master data.')
  }
  return result.data as T
 } catch (error) {
  if (timedOut) throw new Error(method === 'GET' ? 'Hết thời gian tải trạng thái.' : 'Chưa xác định kết quả yêu cầu. Hãy tải lại trạng thái trước khi gửi lại.')
  if (signal?.aborted) throw error
  if (error instanceof TypeError) throw new Error(method === 'GET' ? 'Không thể kết nối Account.' : 'Mất kết nối; yêu cầu có thể đã được nhận. Hãy tải lại trạng thái trước khi gửi lại.')
  throw error
 } finally {
  clearTimeout(timer)
  signal?.removeEventListener('abort', abort)
 }
}

function count(value: unknown): number {
 const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value
 if (typeof parsed !== 'number' || !Number.isSafeInteger(parsed) || parsed < 0) throw new Error('Trạng thái master từ Account không hợp lệ.')
 return parsed
}

export async function getMasterdataStatus(signal?: AbortSignal): Promise<MasterdataStatus> {
 const data = await request<MasterdataStatus>('/status', 'GET', undefined, signal)
 if (!data || !Array.isArray(data.servers) || data.servers.length > 4096) throw new Error('Trạng thái master từ Account không hợp lệ.')
 return {
  latest_revision: count(data.latest_revision),
  servers: data.servers.map(row => {
   if (!row || typeof row.server_id !== 'string' || typeof row.callback_url !== 'string') throw new Error('Trạng thái server từ Account không hợp lệ.')
   return { ...row, desired_revision: count(row.desired_revision), applied_revision: count(row.applied_revision), attempts: count(row.attempts) }
  }),
 }
}

export const publishMasterdata = () => request<MasterdataPublication>('/publish', 'POST')
export const registerMasterdataServer = (id: string, callbackUrl: string) =>
 request<{ server_id: string; deliveries: MasterdataDelivery[] }>(`/servers/${encodeURIComponent(id)}`, 'PUT', { callback_url: callbackUrl })
export const syncMasterdataServer = (id: string) =>
 request<{ server_id: string; revision: number; deliveries: MasterdataDelivery[] }>(`/servers/${encodeURIComponent(id)}/sync`, 'POST')

export function validMasterdataCallback(value: string): boolean {
 try {
  const url = new URL(value)
  return value.length <= 512 && url.protocol === 'https:' && !url.username && !url.password && !value.includes('?') && !value.includes('#') && url.pathname === '/internal/masterdata/update'
 } catch { return false }
}
