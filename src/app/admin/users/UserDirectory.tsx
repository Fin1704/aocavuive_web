'use client'

import { useEffect, useState } from 'react'
import { AdminUserDetail, AdminUserList, getAdminUser, listAdminUsers } from '@/services/adminUserService'

const control = 'rounded-lg border border-white/15 bg-[#13161b] px-3 py-2 text-sm text-white disabled:opacity-40'
const display = (value: string | number | null | undefined) => value === null || value === undefined || value === '' ? '—' : String(value)
const onlineDate = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }) : 'Chưa ghi nhận'

function Fields({ entries }: { entries: [string, string | number | null | undefined][] }) {
	return <dl className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
		{entries.map(([label, value]) => <div key={label} className='min-w-0'>
			<dt className='text-xs text-gray-400'>{label}</dt>
			<dd className='mt-1 text-sm text-white break-words whitespace-pre-wrap'>{display(value)}</dd>
		</div>)}
	</dl>
}

function UserDetails({ user }: { user: AdminUserDetail }) {
	const account = user.account
	const vip = account?.vip
	return <div className='space-y-6'>
		<Fields entries={[
			['User ID', user.id], ['Email', user.email], ['Username', user.username],
			['Xác minh email', user.is_verified ? 'Đã xác minh' : 'Chưa xác minh'],
			['URL avatar', user.avatar_url], ['Lần đổi username', user.username_changed_at],
			['IP đăng ký', user.register_ip], ['IP đăng nhập gần nhất', user.last_login_ip],
			['Ngày tạo user', user.created_at], ['Cập nhật user', user.updated_at],
			['Số dư Sò', user.shells?.toLocaleString('vi-VN')],
			['Combo điểm danh hiện tại', `${user.checkin_streak ?? 0} ngày`],
			['Combo cao nhất', `${user.checkin_best_streak ?? 0} ngày`],
			['Điểm danh gần nhất', user.last_checkin_date],
			['Online gần nhất (giờ Việt Nam)', onlineDate(user.last_online_at)],
		]} />
		<section className='space-y-3 border-t border-white/10 pt-4'>
			<h3 className='font-semibold'>Tài khoản · Vàng · EXP · VIP</h3>
			{account ? <Fields entries={[
				['Account ID', account.id], ['User ID của account', account.user_id],
				['Vàng', account.gold], ['EXP', account.experience],
				['Ngày tạo account', account.created_at], ['Cập nhật account', account.updated_at],
				['Cấp VIP', vip?.vip_level ?? 'Chưa có VIP'], ['EXP yêu cầu', vip?.exp_required],
				['VIP ID', vip?.id], ['Ngày tạo mốc VIP', vip?.created_at], ['Cập nhật mốc VIP', vip?.updated_at],
			]} /> : <p className='text-sm text-gray-400'>User chưa có dữ liệu tài khoản.</p>}
		</section>
		<section className='space-y-3 border-t border-white/10 pt-4'>
			<h3 className='font-semibold'>Vai trò và quyền</h3>
			{user.roles.length ? user.roles.map(role => <div key={role.id} className='rounded-lg border border-white/10 p-3'>
				<Fields entries={[
					['Tên vai trò', role.name], ['Slug', role.slug], ['Role ID', role.id], ['Mô tả', role.description],
					['Ngày tạo vai trò', role.created_at], ['Cập nhật vai trò', role.updated_at],
				]} />
			</div>) : <p className='text-sm text-gray-400'>Chưa được gán vai trò.</p>}
			{user.roles.some(role => role.slug === 'admin') && <p className='text-sm text-orange-300'>Admin có toàn bộ quyền quản trị.</p>}
			<p className='text-xs text-gray-400'>Các quyền được gán qua vai trò</p>
			<p className='text-sm break-words'>{user.permissions.length ? user.permissions.join(', ') : 'Chưa có quyền được gán.'}</p>
		</section>
	</div>
}

export default function UserDirectory({ revision, onSelect }: { revision: number; onSelect: (id: string) => void }) {
	const [query, setQuery] = useState('')
	const [filters, setFilters] = useState({ q: '', verified: '', page: 1 })
	const [list, setList] = useState<AdminUserList | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [detail, setDetail] = useState<AdminUserDetail | null>(null)
	const [detailError, setDetailError] = useState('')
	const [detailLoading, setDetailLoading] = useState(false)
	const [retry, setRetry] = useState(0)
	const [detailRetry, setDetailRetry] = useState(0)

	useEffect(() => {
		const controller = new AbortController()
		setLoading(true)
		setError('')
		setList(null)
		listAdminUsers(filters, controller.signal).then(data => {
			if (!controller.signal.aborted) setList(data)
		}).catch(err => {
			if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Không thể tải danh sách')
		}).finally(() => { if (!controller.signal.aborted) setLoading(false) })
		return () => controller.abort()
	}, [filters, revision, retry])

	useEffect(() => {
		if (!selectedId) return
		const controller = new AbortController()
		setDetail(null)
		setDetailError('')
		setDetailLoading(true)
		getAdminUser(selectedId, controller.signal).then(data => {
			if (!controller.signal.aborted) setDetail(data)
		}).catch(err => {
			if (!controller.signal.aborted) setDetailError(err instanceof Error ? err.message : 'Không thể tải chi tiết')
		}).finally(() => { if (!controller.signal.aborted) setDetailLoading(false) })
		return () => controller.abort()
	}, [selectedId, revision, retry, detailRetry])

	return <div className='space-y-5'>
		<section className='bg-semidark rounded-2xl p-4 sm:p-6 space-y-4'>
			<div className='flex flex-wrap justify-between gap-3'>
				<h2 className='text-lg font-semibold text-white'>Danh sách người dùng</h2>
				<button className={control} onClick={() => setRetry(value => value + 1)} disabled={loading}>Tải lại</button>
			</div>
			<form className='flex flex-wrap gap-3' onSubmit={event => { event.preventDefault(); setFilters(value => ({ ...value, q: query.trim(), page: 1 })) }}>
				<input aria-label='Tìm user theo email, username hoặc ID' placeholder='Email, username hoặc User ID' maxLength={255} className={`${control} flex-1 min-w-0`} value={query} onChange={event => setQuery(event.target.value)} />
				<select aria-label='Trạng thái xác minh email' className={control} value={filters.verified} onChange={event => setFilters(value => ({ ...value, verified: event.target.value, page: 1 }))}>
					<option value=''>Tất cả trạng thái</option><option value='1'>Đã xác minh</option><option value='0'>Chưa xác minh</option>
				</select>
				<button className={control} type='submit'>Tìm kiếm</button>
			</form>
			{loading && <p role='status' className='text-gray-400'>Đang tải danh sách...</p>}
			{error && <p role='alert' className='text-red-300'>{error} <button className={control} onClick={() => setRetry(value => value + 1)}>Thử lại</button></p>}
			{list && <>
				<div className='overflow-x-auto'>
					<table className='w-full text-sm text-left text-gray-300'>
						<thead className='text-xs text-gray-400 border-b border-white/10'><tr>{['Người dùng', 'Email', 'Xác minh', 'Sò', 'Combo', 'Online gần nhất (VN)', 'Ngày tạo', 'Chi tiết'].map(label => <th key={label} className='p-3 whitespace-nowrap'>{label}</th>)}</tr></thead>
						<tbody>{list.users.map(user => <tr key={user.id} className={`border-b border-white/5 ${selectedId === user.id ? 'bg-white/5' : ''}`}>
							<td className='p-3'><span className='text-white'>{user.username ? `@${user.username}` : 'Chưa đặt username'}</span><p className='font-mono text-xs text-gray-400 mt-1'>{user.id}</p></td>
							<td className='p-3 break-all'>{user.email}</td><td className='p-3'>{user.is_verified ? 'Đã xác minh' : 'Chưa xác minh'}</td>
							<td className='p-3 font-semibold text-amber-200 whitespace-nowrap'>{user.shells?.toLocaleString('vi-VN') ?? '—'}</td>
							<td className='p-3 whitespace-nowrap'>{user.checkin_streak ?? 0} ngày</td>
							<td className='p-3 whitespace-nowrap'>{onlineDate(user.last_online_at)}</td>
							<td className='p-3 whitespace-nowrap'>{display(user.created_at)}</td>
							<td className='p-3'><button aria-label={`Xem chi tiết ${user.email}`} className={control} onClick={() => { setDetail(null); setDetailError(''); setDetailLoading(true); setSelectedId(user.id); setDetailRetry(value => value + 1); onSelect(user.id) }}>Xem</button></td>
						</tr>)}</tbody>
					</table>
				</div>
				{list.users.length === 0 && <p className='text-gray-400 py-4'>Không tìm thấy người dùng phù hợp.</p>}
				<div className='flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400'>
					<span>{list.pagination.total} người dùng · Trang {list.pagination.page}/{Math.max(1, list.pagination.pages)}</span>
					<div className='flex gap-2'>
						<button className={control} disabled={list.pagination.page <= 1} onClick={() => setFilters(value => ({ ...value, page: list.pagination.page - 1 }))}>Trước</button>
						<button className={control} disabled={list.pagination.page >= list.pagination.pages} onClick={() => setFilters(value => ({ ...value, page: list.pagination.page + 1 }))}>Sau</button>
					</div>
				</div>
			</>}
		</section>
		{selectedId && <section aria-label='Chi tiết người dùng' aria-busy={detailLoading} className='bg-semidark rounded-2xl p-4 sm:p-6 text-white space-y-4'>
			<div className='flex justify-between items-center gap-3'><h2 className='text-lg font-semibold'>Chi tiết người dùng</h2><button className={control} onClick={() => setSelectedId(null)}>Đóng</button></div>
			<p className='font-mono text-xs text-gray-400 break-all'>{selectedId}</p>
			{detailLoading && <p role='status'>Đang tải chi tiết...</p>}
			{detailError && <p role='alert' className='text-red-300'>{detailError} <button className={control} onClick={() => setDetailRetry(value => value + 1)}>Thử lại</button></p>}
			{detail && <UserDetails user={detail} />}
		</section>}
	</div>
}
