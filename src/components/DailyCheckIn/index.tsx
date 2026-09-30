'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Flame, RotateCw } from 'lucide-react'
import CurrencyIcon from '../CurrencyIcon'
import { CheckInStatus, claimCheckIn, getCheckIn } from '@/services/checkInService'
import './daily-check-in.css'

export default function DailyCheckIn({ userId }: { userId: string }) {
	const [data, setData] = useState<CheckInStatus | null>(null)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')
	const [award, setAward] = useState<number | null>(null)
	const pending = useRef<AbortController | null>(null)
	const dataRef = useRef<CheckInStatus | null>(null)

	const load = useCallback(async () => {
		if (pending.current || document.hidden) return
		const controller = new AbortController()
		pending.current = controller
		setBusy(true)
		try {
			const status = await getCheckIn(controller.signal)
			if (controller.signal.aborted) return
			if (dataRef.current?.date !== status.date) setAward(null)
			dataRef.current = status
			setData(status); setError('')
		} catch (err) {
			if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Chưa tải được quà hằng ngày.')
		} finally {
			if (pending.current === controller) { pending.current = null; setBusy(false) }
		}
	}, [])

	useEffect(() => {
		setData(null); dataRef.current = null; setAward(null); setError('')
		void load()
		const refresh = () => { if (!document.hidden) void load() }
		const storage = (event: StorageEvent) => { if (event.key === 'aocavuive:checkin-updated') refresh() }
		window.addEventListener('focus', refresh)
		document.addEventListener('visibilitychange', refresh)
		window.addEventListener('storage', storage)
		return () => {
			pending.current?.abort(); pending.current = null
			window.removeEventListener('focus', refresh)
			document.removeEventListener('visibilitychange', refresh)
			window.removeEventListener('storage', storage)
		}
	}, [userId, load])

	useEffect(() => {
		if (!data) return
		// Use server-relative duration so a wrong device clock cannot unlock a reward.
		const delay = Math.max(1000, Date.parse(data.next_reset_at) - Date.parse(data.server_time) + 1000)
		const timer = setTimeout(() => void load(), Math.min(delay, 86_401_000))
		return () => clearTimeout(timer)
	}, [data, load])

	const claim = async () => {
		if (pending.current || !data || data.checked_in_today) return
		const controller = new AbortController()
		pending.current = controller
		setBusy(true); setError(''); setAward(null)
		try {
			const result = await claimCheckIn(controller.signal)
			if (controller.signal.aborted) return
			dataRef.current = result
			setData(result)
			if (result.claimed) setAward(result.today_reward)
			try { localStorage.setItem('aocavuive:checkin-updated', JSON.stringify({ userId, at: Date.now() })) } catch { /* Storage is optional. */ }
		} catch (err) {
			if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Chưa nhận được Sò. Bạn thử lại nhé!')
		} finally {
			if (pending.current === controller) { pending.current = null; setBusy(false) }
		}
	}

	const days = data ? Array.from({ length: 7 }, (_, i) => {
		const date = new Date(`${data.date}T00:00:00Z`)
		date.setUTCDate(date.getUTCDate() - 6 + i)
		const key = date.toISOString().slice(0, 10)
		return { key, label: i === 6 ? 'Nay' : `${date.getUTCDate()}/${date.getUTCMonth() + 1}`, reward: data.recent_checkins.find(day => day.checkin_date === key)?.reward }
	}) : []

	return <section className={`daily-check-in ${award !== null ? 'check-in-awarded' : ''}`} aria-label='Điểm danh hằng ngày'>
		<div className='check-in-heading'>
			<div>
				<h2>Điểm danh hằng ngày</h2>
				<p className='check-in-offer'>Nhận {data?.reward_min ?? 1}–{data?.reward_max ?? 3} Sò mỗi ngày.</p>
			</div>
			<div className='check-in-wallet'>
				<CurrencyIcon currency='so' size={36} className='check-in-shell' />
				<div><span className='check-in-wallet-label'>Sò của bạn</span><p><strong>{data ? data.shells.toLocaleString('vi-VN') : '—'}</strong><span>Sò</span></p></div>
			</div>
		</div>
		{data && <ol className='check-in-days' aria-label='Lịch điểm danh 7 ngày gần nhất'>{days.map((day, i) => <li key={day.key} className={`${day.reward ? 'is-collected' : ''} ${i === 6 ? 'is-today' : ''}`} aria-label={`${day.key}: ${day.reward ? `đã nhận ${day.reward} Sò` : i === 6 ? 'chưa điểm danh' : 'không điểm danh'}`}>
			<span>{day.label}</span><div>{day.reward ? <Check size={18} aria-hidden='true' /> : <CurrencyIcon currency='so' size={24} />}</div>
		</li>)}</ol>}
		<div className='check-in-feedback' aria-live='polite' aria-atomic='true'>
			{award !== null ? <p className='check-in-reward'><Check size={17} aria-hidden='true' /> Đã nhận +{award} Sò</p> : data?.checked_in_today ? <p>Hôm nay đã nhận {data.today_reward} Sò.</p> : !data && busy ? <p>Đang tải điểm danh...</p> : null}
		</div>
		{error && <p className='check-in-error' role='alert'>{error} {data && <button className='check-in-retry' disabled={busy} onClick={() => void load()}>Thử lại</button>}</p>}
		<div className='check-in-footer'>
			<div className='check-in-summary'>
				<span className='check-in-combo'><Flame size={15} aria-hidden='true' /> {data ? data.streak : '—'} ngày</span>
				{data && <span className='check-in-record'>Kỷ lục {data.best_streak} ngày</span>}
			</div>
			{!data ? <button className='check-in-claim' disabled={busy} onClick={() => void load()}><RotateCw size={17} aria-hidden='true' /> {busy ? 'Đang tải...' : 'Thử lại'}</button> : <button className='check-in-claim' disabled={busy || data.checked_in_today} onClick={claim}>
				{data.checked_in_today && <Check size={18} aria-hidden='true' />}
				{busy ? 'Đang nhận...' : data.checked_in_today ? 'Đã điểm danh' : 'Điểm danh nhận Sò'}
			</button>}
		</div>
		<p className='check-in-note'>Làm mới lúc 00:00, giờ Việt Nam</p>
	</section>
}
