'use client'

import { useEffect } from 'react'
import { accountRequest } from '@/services/checkInService'

export default function UserActivity() {
	useEffect(() => {
		let pending: AbortController | null = null
		const ping = async () => {
			if (document.hidden || pending) return
			try { if (!localStorage.getItem('access_token')) return } catch { return }
			const controller = new AbortController()
			pending = controller
			try { await accountRequest('/account/activity', 'POST', controller.signal) } catch { /* Retry on next visible heartbeat. */ }
			finally { if (pending === controller) pending = null }
		}
		const visibility = () => { if (document.hidden) { pending?.abort(); pending = null } else void ping() }
		void ping()
		const timer = setInterval(ping, 60_000)
		document.addEventListener('visibilitychange', visibility)
		return () => { clearInterval(timer); pending?.abort(); document.removeEventListener('visibilitychange', visibility) }
	}, [])
	return null
}
