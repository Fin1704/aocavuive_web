import { getApiUrl } from '@/config/api'

export type ClientPlatform = 'Windows' | 'Android' | 'iOS'
export interface ClientRelease {
  id: string; title: string; created_at: string; activated_at: string
  release_hash: string; base_version: string; engine: string; mode: 'code' | 'content'
  pack_count: number; file_count: number; bytes: number
}
export interface ClientUpdates {
  platform: ClientPlatform; current: ClientRelease | null; history: ClientRelease[]; max_upload_bytes: number
}
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` })
const endpoint = (platform: ClientPlatform) => getApiUrl(`/admin/client-updates/${platform}`)
export async function loadClientUpdates(platform: ClientPlatform, signal?: AbortSignal): Promise<ClientUpdates> {
  return decode(await fetch(endpoint(platform), { headers: headers(), cache: 'no-store', signal }))
}
async function decode(response: Response): Promise<ClientUpdates> {
  const json = await response.json().catch(() => null)
  if (!response.ok || json?.status !== 'success') throw new Error(json?.message || `Không thể xử lý cập nhật (HTTP ${response.status}).`)
  return json.data
}
export async function changeClientUpdate(platform: ClientPlatform, id: string, action: 'activate' | 'delete', currentId: string, signal?: AbortSignal): Promise<ClientUpdates> {
  return decode(await fetch(`${endpoint(platform)}/${id}${action === 'activate' ? '/activate' : ''}`, {
    method: action === 'activate' ? 'POST' : 'DELETE', headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ expected_current_id: currentId }), signal,
  }))
}
export function uploadClientUpdate(platform: ClientPlatform, file: File, title: string, currentId: string, progress: (value: number) => void, signal: AbortSignal): Promise<ClientUpdates> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const abort = () => xhr.abort()
    const cleanup = () => signal.removeEventListener('abort', abort)
    xhr.open('POST', `${endpoint(platform)}/upload`)
    xhr.setRequestHeader('Authorization', headers().Authorization)
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress(Math.round(event.loaded / event.total * 100)) }
    xhr.onerror = () => { cleanup(); reject(new Error('Mất kết nối khi tải lên. Hãy tải lại danh sách trước khi thử lại.')) }
    xhr.onabort = () => { cleanup(); reject(new DOMException('Aborted', 'AbortError')) }
    xhr.onload = () => {
      cleanup()
      let json
      try { json = JSON.parse(xhr.responseText) } catch { /* Hosting can return an HTML upload-limit error. */ }
      if (xhr.status >= 200 && xhr.status < 300 && json?.status === 'success') resolve(json.data)
      else reject(new Error(json?.message || `Không thể tải lên (HTTP ${xhr.status}). Kiểm tra giới hạn upload hosting.`))
    }
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) { cleanup(); reject(new DOMException('Aborted', 'AbortError')); return }
    const data = new FormData()
    data.append('file', file); data.append('title', title); data.append('expected_current_id', currentId)
    xhr.send(data)
  })
}
