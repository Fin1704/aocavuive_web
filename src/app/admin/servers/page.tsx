'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

import { style } from '@/constants/style'
import { useAuth } from '@/hooks/useAuth'
import {
	GameServer,
	getAdminServers,
	createServer,
	updateServer,
	deleteServer,
} from '@/services/serverService'

type Status = 'online' | 'offline' | 'maintenance'

const STATUS_LABELS: Record<Status, string> = {
	online: 'Online',
	offline: 'Offline',
	maintenance: 'Bảo trì',
}

const STATUS_COLORS: Record<Status, string> = {
	online: 'text-green-400 bg-green-400/10',
	offline: 'text-red-400 bg-red-400/10',
	maintenance: 'text-yellow-400 bg-yellow-400/10',
}

const EMPTY_FORM = {
	name: '',
	server_number: '',
	url: '',
	status: 'offline' as Status,
	ip: '',
	port: '',
	note: '',
}

export default function AdminServersPage() {
	const router = useRouter()
	const { isLoggedIn, mounted, isAdmin } = useAuth()

	const [servers, setServers] = useState<GameServer[]>([])
	const [loading, setLoading] = useState(true)

	// Form tạo mới
	const [form, setForm] = useState(EMPTY_FORM)
	const [creating, setCreating] = useState(false)

	// Inline edit
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editForm, setEditForm] = useState(EMPTY_FORM)

	useEffect(() => {
		if (!mounted) return
		if (!isLoggedIn || !isAdmin) router.replace('/')
	}, [mounted, isLoggedIn, isAdmin, router])

	useEffect(() => {
		if (!mounted || !isAdmin) return
		fetchServers()
	}, [mounted, isAdmin])

	const fetchServers = async () => {
		setLoading(true)
		try {
			const data = await getAdminServers()
			setServers(data)
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi tải danh sách server')
		} finally {
			setLoading(false)
		}
	}

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!form.url.trim()) return
		setCreating(true)
		try {
			await createServer({
				name: form.name.trim() || undefined,
				server_number: form.server_number ? Number(form.server_number) : null,
				url: form.url.trim(),
				status: form.status,
				ip: form.ip.trim() || undefined,
				port: form.port ? Number(form.port) : null,
				note: form.note.trim() || undefined,
			})
			toast.success('Đã thêm server mới!')
			setForm(EMPTY_FORM)
			await fetchServers()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi tạo server')
		} finally {
			setCreating(false)
		}
	}

	const startEdit = (server: GameServer) => {
		setEditingId(server.id)
		setEditForm({
			name: server.name ?? '',
			server_number: server.server_number != null ? String(server.server_number) : '',
			url: server.url,
			status: server.status,
			ip: server.ip ?? '',
			port: server.port != null ? String(server.port) : '',
			note: server.note ?? '',
		})
	}

	const handleUpdate = async (id: string) => {
		try {
			await updateServer(id, {
				name: editForm.name.trim() || undefined,
				server_number: editForm.server_number ? Number(editForm.server_number) : null,
				url: editForm.url.trim(),
				status: editForm.status,
				ip: editForm.ip.trim() || undefined,
				port: editForm.port ? Number(editForm.port) : null,
				note: editForm.note.trim() || undefined,
			})
			toast.success('Đã cập nhật server!')
			setEditingId(null)
			await fetchServers()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật server')
		}
	}

	const handleDelete = async (id: string, label: string) => {
		if (!confirm(`Xóa server "${label}"?`)) return
		try {
			await deleteServer(id)
			toast.success('Đã xóa server!')
			await fetchServers()
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : 'Lỗi xóa server')
		}
	}

	if (!mounted || !isLoggedIn || !isAdmin) return null

	const inputCls =
		'h-9 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/30'
	const selectCls =
		'h-9 rounded-lg bg-[#13161b] border border-white/10 text-white px-3 text-sm focus:outline-none focus:border-white/30'

	return (
		<div className='min-h-screen p-6 space-y-6' style={{ backgroundColor: '#13161b' }}>
			<div className='flex items-center gap-3'>
				<Link
					href='/admin'
					className='text-gray-400 hover:text-white transition-colors text-sm'>
					← Quản trị
				</Link>
				<span className='text-gray-600'>/</span>
				<h1 className='text-2xl font-bold text-white'>Quản lý Servers</h1>
			</div>

			{/* Form thêm mới */}
			<div className='bg-semidark rounded-2xl p-6 space-y-4'>
				<h2 className='text-white font-semibold'>Thêm server mới</h2>
				<form onSubmit={handleCreate} className='flex flex-wrap gap-3 items-end'>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>Số server</label>
						<input
							type='number'
							min={1}
							value={form.server_number}
							onChange={(e) => setForm({ ...form, server_number: e.target.value })}
							placeholder='1'
							className={`${inputCls} w-20`}
						/>
					</div>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>Tên server</label>
						<input
							type='text'
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							placeholder='Server Mới'
							className={`${inputCls} w-40`}
						/>
					</div>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>URL *</label>
						<input
							type='text'
							value={form.url}
							onChange={(e) => setForm({ ...form, url: e.target.value })}
							placeholder='https://server1.aocavuive.com'
							className={`${inputCls} w-52`}
							required
						/>
					</div>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>Trạng thái</label>
						<select
							value={form.status}
							onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
							className={`${selectCls} w-36`}>
							<option value='offline'>Offline</option>
							<option value='online'>Online</option>
							<option value='maintenance'>Bảo trì</option>
						</select>
					</div>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>IP</label>
						<input
							type='text'
							value={form.ip}
							onChange={(e) => setForm({ ...form, ip: e.target.value })}
							placeholder='192.168.1.1'
							className={`${inputCls} w-36`}
						/>
					</div>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>Port</label>
						<input
							type='number'
							min={1}
							max={65535}
							value={form.port}
							onChange={(e) => setForm({ ...form, port: e.target.value })}
							placeholder='8080'
							className={`${inputCls} w-24`}
						/>
					</div>
					<div className='space-y-1'>
						<label className='text-xs text-gray-400'>Ghi chú</label>
						<input
							type='text'
							value={form.note}
							onChange={(e) => setForm({ ...form, note: e.target.value })}
							placeholder='Ghi chú...'
							className={`${inputCls} w-44`}
						/>
					</div>
					<button
						type='submit'
						disabled={creating}
						className='h-9 px-5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60'
						style={{ backgroundImage: style.backgroundImage }}>
						{creating ? 'Đang thêm...' : 'Thêm Server'}
					</button>
				</form>
			</div>

			{/* Danh sách */}
			<div className='bg-semidark rounded-2xl p-6'>
				{loading ? (
					<p className='text-gray-400 text-sm'>Đang tải...</p>
				) : servers.length === 0 ? (
					<p className='text-gray-400 text-sm'>Chưa có server nào.</p>
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full text-sm text-white'>
							<thead>
								<tr className='text-gray-400 border-b border-white/10 text-left'>
									<th className='py-2 pr-4 w-12'>Số</th>
									<th className='py-2 pr-4'>Tên</th>
									<th className='py-2 pr-4'>URL</th>
									<th className='py-2 pr-4'>Trạng thái</th>
									<th className='py-2 pr-4'>IP</th>
									<th className='py-2 pr-4'>Port</th>
									<th className='py-2 pr-4'>Ghi chú</th>
									<th className='py-2'>Hành động</th>
								</tr>
							</thead>
							<tbody>
								{servers.map((server) =>
									editingId === server.id ? (
										<tr key={server.id} className='border-b border-white/5'>
											<td className='py-2 pr-3'>
												<input
													type='number'
													min={1}
													value={editForm.server_number}
													onChange={(e) =>
														setEditForm({ ...editForm, server_number: e.target.value })
													}
													className={`${inputCls} w-16`}
												/>
											</td>
											<td className='py-2 pr-3'>
												<input
													type='text'
													value={editForm.name}
													onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
													className={`${inputCls} w-36`}
												/>
											</td>
											<td className='py-2 pr-3'>
												<input
													type='text'
													value={editForm.url}
													onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
													className={`${inputCls} w-44`}
												/>
											</td>
											<td className='py-2 pr-3'>
												<select
													value={editForm.status}
													onChange={(e) =>
														setEditForm({ ...editForm, status: e.target.value as Status })
													}
													className={`${selectCls} w-32`}>
													<option value='offline'>Offline</option>
													<option value='online'>Online</option>
													<option value='maintenance'>Bảo trì</option>
												</select>
											</td>
											<td className='py-2 pr-3'>
												<input
													type='text'
													value={editForm.ip}
													onChange={(e) => setEditForm({ ...editForm, ip: e.target.value })}
													className={`${inputCls} w-32`}
												/>
											</td>
											<td className='py-2 pr-3'>
												<input
													type='number'
													min={1}
													max={65535}
													value={editForm.port}
													onChange={(e) =>
														setEditForm({ ...editForm, port: e.target.value })
													}
													className={`${inputCls} w-20`}
												/>
											</td>
											<td className='py-2 pr-3'>
												<input
													type='text'
													value={editForm.note}
													onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
													className={`${inputCls} w-36`}
												/>
											</td>
											<td className='py-2'>
												<div className='flex gap-2'>
													<button
														onClick={() => handleUpdate(server.id)}
														className='px-3 py-1 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90'
														style={{ backgroundImage: style.backgroundImage }}>
														Lưu
													</button>
													<button
														onClick={() => setEditingId(null)}
														className='px-3 py-1 rounded-lg text-white text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors'>
														Hủy
													</button>
												</div>
											</td>
										</tr>
									) : (
										<tr
											key={server.id}
											className='border-b border-white/5 hover:bg-white/5 transition-colors'>
											<td className='py-2 pr-4 text-gray-300'>
												{server.server_number ?? '—'}
											</td>
											<td className='py-2 pr-4 font-medium'>
												{server.name || '—'}
											</td>
											<td className='py-2 pr-4 max-w-[180px] truncate'>
												<a
													href={server.url}
													target='_blank'
													rel='noreferrer'
													className='hover:underline text-blue-400'>
													{server.url}
												</a>
											</td>
											<td className='py-2 pr-4'>
												<span
													className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[server.status]}`}>
													{STATUS_LABELS[server.status]}
												</span>
											</td>
											<td className='py-2 pr-4 text-gray-300'>{server.ip ?? '—'}</td>
											<td className='py-2 pr-4 text-gray-300'>{server.port ?? '—'}</td>
											<td className='py-2 pr-4 text-gray-400 max-w-[140px] truncate'>
												{server.note || '—'}
											</td>
											<td className='py-2'>
												<div className='flex gap-2'>
													<button
														onClick={() => startEdit(server)}
														className='px-3 py-1 rounded-lg text-white text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors'>
														Sửa
													</button>
													<button
														onClick={() =>
															handleDelete(
																server.id,
																server.name ?? server.url,
															)
														}
														className='px-3 py-1 rounded-lg text-red-400 text-xs font-semibold bg-red-400/10 hover:bg-red-400/20 transition-colors'>
														Xóa
													</button>
												</div>
											</td>
										</tr>
									)
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}
