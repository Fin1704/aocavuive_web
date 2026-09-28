'use client'

import { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { FaHandPointer, FaForward, FaRotateLeft } from 'react-icons/fa6'
import WaterVeil from './WaterVeil'
import RefractedWater from './RefractedWater'
import { createSession, PORTRAIT_QUERY, transition, waitForImage } from './model'
import './ocean-intro.css'
import './fish-frames.css'

const session = createSession(() => window.sessionStorage)
const bubbles = Array.from({ length: 28 }, (_, i) => ({
	'--x': `${(i * 37 + 7) % 100}%`, '--size': `${9 + i % 7 * 10}px`,
	'--duration': `${7 + i % 6 * 1.7}s`, '--delay': `${-i * 1.7}s`,
} as CSSProperties))
const sparks = Array.from({ length: 24 }, (_, i) => ({ '--x': `${i * 43 % 100}%`, '--y': `${i * 31 % 100}%`, '--delay': `${-i * .71}s` } as CSSProperties))

export default function OceanIntro({ children }: { children: ReactNode }) {
	const [stage, dispatch] = useReducer(transition, 'checking')
	const [hasBackground, setHasBackground] = useState(false)
	const [hidden, setHidden] = useState(false)
	const shellRef = useRef<HTMLDivElement>(null)
	const dialogRef = useRef<HTMLDivElement>(null)
	const skipRef = useRef<HTMLButtonElement>(null)
	const openRef = useRef<HTMLButtonElement>(null)
	const startRef = useRef<HTMLButtonElement>(null)
	const didInteract = useRef(false)
	const ripplesRef = useRef<HTMLDivElement>(null)
	const lastRipple = useRef(0)
	const finished = stage === 'done'
	const reveal = useCallback(() => dispatch('REVEAL'), [])
	const skip = useCallback(() => { didInteract.current = true; session.complete(); dispatch('SKIP') }, [])

	useEffect(() => {
		const preview = new URLSearchParams(window.location.search).get('intro') === '1'
		dispatch(!preview && session.hasSeen() ? 'SEEN_SESSION' : 'NEW_SESSION')
	}, [])
	useEffect(() => {
		if (finished) return
		const visibility = () => setHidden(document.hidden)
		visibility()
		document.addEventListener('visibilitychange', visibility)
		return () => document.removeEventListener('visibilitychange', visibility)
	}, [finished])

	useEffect(() => {
		if (stage !== 'loading') return
		const source = window.matchMedia(PORTRAIT_QUERY).matches ? 'reef-portrait-clear.webp' : 'reef-landscape-clear.webp'
		return waitForImage(new Image(), `/ocean-intro/${source}`, loaded => {
			setHasBackground(loaded); dispatch('ASSETS_READY')
		})
	}, [stage])

	useEffect(() => {
		if (hidden) return
		if (stage === 'revealing') {
			const timer = setTimeout(() => dispatch('REVEALED'), 1200)
			return () => clearTimeout(timer)
		}
		if (stage === 'entering') {
			const timer = setTimeout(() => { session.complete(); dispatch('ENTERED') }, 1800)
			return () => clearTimeout(timer)
		}
	}, [stage, hidden])

	useEffect(() => {
		if (finished) return
		const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
		const overflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		skipRef.current?.focus({ preventScroll: true })
		const keydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') { event.preventDefault(); skip(); return }
			if (event.key !== 'Tab') return
			const buttons = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []).filter(node => node.getClientRects().length > 0)
			const first = buttons[0], last = buttons[buttons.length - 1]
			if (!first) { event.preventDefault(); return }
			if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus() }
			else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus() }
		}
		document.addEventListener('keydown', keydown)
		return () => {
			document.body.style.overflow = overflow
			document.removeEventListener('keydown', keydown)
			if (previous?.isConnected) previous.focus({ preventScroll: true })
		}
	}, [finished, skip])

	useEffect(() => {
		if (stage === 'wiping') openRef.current?.focus({ preventScroll: true })
		if (stage === 'revealing' || stage === 'entering') skipRef.current?.focus({ preventScroll: true })
		if (stage === 'welcome') startRef.current?.focus({ preventScroll: true })
		if (finished && didInteract.current) shellRef.current?.querySelector<HTMLElement>('main')?.focus({ preventScroll: true })
	}, [stage, finished])

	const ripple = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (hidden) return
		if (event.type === 'pointermove' && performance.now() - lastRipple.current < 150) return
		lastRipple.current = performance.now()
		if (event.pointerType === 'mouse') {
			dialogRef.current?.style.setProperty('--look-x', `${(event.clientX / window.innerWidth - .5) * 20}px`)
			dialogRef.current?.style.setProperty('--look-y', `${(event.clientY / window.innerHeight - .5) * 14}px`)
		}
		const host = ripplesRef.current
		if (!host) return
		const ring = document.createElement('i')
		ring.style.left = `${event.clientX}px`; ring.style.top = `${event.clientY}px`
		ring.addEventListener('animationend', () => ring.remove(), { once: true })
		while (host.children.length >= 8) host.firstElementChild?.remove()
		host.appendChild(ring)
	}

	return <>
		<div ref={shellRef} inert={!finished} aria-hidden={!finished || undefined}>{children}</div>
		{!finished && <div ref={dialogRef} role='dialog' aria-modal='true' aria-label='Khám phá đại dương Ao Cá Vui Vẻ'
			className={`ocean-intro ${hidden ? 'ocean-hidden' : ''}`} data-stage={stage}
			onPointerMove={ripple} onPointerDown={ripple}>
			<div className='ocean-world' aria-hidden='true'>
				{hasBackground && <picture>
					<source media={PORTRAIT_QUERY} srcSet='/ocean-intro/reef-portrait-clear.webp' />
					<img className='ocean-background' src='/ocean-intro/reef-landscape-clear.webp' alt='' draggable={false} onError={() => setHasBackground(false)} />
				</picture>}
				{hasBackground && <RefractedWater active={!hidden} />}
				<div className='ocean-light' />
				<div className='ocean-beams'>{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--angle': `${-43 + i * 13}deg`, '--delay': `${-i * 1.2}s` } as CSSProperties} />)}</div>
			</div>
			<div className='ocean-fish-layer' aria-hidden='true'>
				<div className='ocean-fish ocean-fish-near'><div className='ocean-fish-facing'><div className='ocean-native-fish ocean-fish-thulu' data-fish='thulu' /></div></div>
				<div className='ocean-fish ocean-fish-far'><div className='ocean-fish-facing'><div className='ocean-native-fish ocean-fish-hecory' data-fish='hecory' /></div></div>
				<div className='ocean-fish ocean-fish-return'><div className='ocean-fish-facing'><div className='ocean-native-fish ocean-fish-bongbong' data-fish='bongbong' /></div></div>
			</div>
			<div className='ocean-vignette' aria-hidden='true' />
			<div className='ocean-bubbles' aria-hidden='true'>{bubbles.map((style, i) => <i key={i} style={style} />)}</div>
			<div className='ocean-plankton' aria-hidden='true'>{sparks.map((style, i) => <i key={i} style={style} />)}</div>
			<div ref={ripplesRef} className='ocean-pointer-ripples' aria-hidden='true' />
			<div className='ocean-topline'>
				<button ref={skipRef} className='ocean-tool ocean-skip' aria-label='Bỏ qua' title='Bỏ qua' onClick={skip}><FaForward aria-hidden='true' /></button>
			</div>
			{(stage === 'checking' || stage === 'loading') && <div className='ocean-loading' role='status'><span className='ocean-loader' />Đang mở đại dương...</div>}
			{(stage === 'wiping' || stage === 'revealing') && <div className='ocean-veil-wrap'>
				<WaterVeil onReveal={reveal} animated={!hidden && stage === 'wiping'} />
			</div>}
			{stage === 'wiping' && <div className='ocean-guide'>
				<div className='ocean-swipe-orbit' aria-hidden='true'><i /><i /><i /><div className='ocean-hand-track'><span /><FaHandPointer className='ocean-hand' /></div></div>
				<p className='ocean-swipe-label'>Vuốt để mở</p>
				<button ref={openRef} className='ocean-keyboard-reveal' aria-label='Mở đại dương' onClick={reveal}>Mở đại dương</button>
			</div>}
			{(stage === 'revealing' || stage === 'welcome' || stage === 'entering') && <div className='ocean-welcome'>
				<div className='ocean-logo-stage'><div className='ocean-logo-halo' aria-hidden='true' /><div className='ocean-logo-float'>
					<img className='ocean-logo' src='/logo.png' alt='Ao Cá Vui Vẻ' draggable={false} onError={event => { event.currentTarget.style.display = 'none' }} />
				</div><div className='ocean-logo-stars' aria-hidden='true'>{sparks.slice(0, 10).map((style, i) => <i key={i} style={style} />)}</div></div>
				<button ref={startRef} className='ocean-start' aria-label='Khám phá Ao Cá' disabled={stage !== 'welcome'} onClick={() => { didInteract.current = true; dispatch('ENTER') }}>
					<img src='/ocean-intro/start-button.webp' alt='' aria-hidden='true' draggable={false} onError={event => { event.currentTarget.style.visibility = 'hidden'; event.currentTarget.parentElement?.classList.add('ocean-button-fallback') }} />
					<span>Bắt đầu</span><i className='ocean-button-glint' aria-hidden='true' />
				</button>
				{stage === 'welcome' && <button className='ocean-tool ocean-replay' aria-label='Xem lại mở đầu' title='Xem lại mở đầu' onClick={() => dispatch('REPLAY')}><FaRotateLeft aria-hidden='true' /></button>}
			</div>}
			<div className='ocean-dive-tunnel' aria-hidden='true'><i /><i /><i /><i /></div>
			<div className='ocean-transition' aria-hidden='true' />
		</div>}
	</>
}
