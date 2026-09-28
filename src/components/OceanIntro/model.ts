export type Stage = 'checking' | 'loading' | 'wiping' | 'revealing' | 'welcome' | 'entering' | 'done'
export type IntroEvent = 'NEW_SESSION' | 'SEEN_SESSION' | 'ASSETS_READY' | 'REVEAL' | 'REVEALED' | 'ENTER' | 'ENTERED' | 'SKIP' | 'REPLAY'
export const SESSION_KEY = 'aocavuive:ocean-intro:v1'
export const REVEAL_COVERAGE = 0.24
export const PORTRAIT_QUERY = '(max-aspect-ratio: 3/4)'

export function transition(stage: Stage, event: IntroEvent): Stage {
	if (event === 'SKIP') return 'done'
	const next: Partial<Record<Stage, Partial<Record<IntroEvent, Stage>>>> = {
		checking: { NEW_SESSION: 'loading', SEEN_SESSION: 'done' },
		loading: { ASSETS_READY: 'wiping' },
		wiping: { REVEAL: 'revealing' },
		revealing: { REVEALED: 'welcome' },
		welcome: { ENTER: 'entering', REPLAY: 'wiping' },
		entering: { ENTERED: 'done' },
	}
	return next[stage]?.[event] ?? stage
}

export function createSession(getStorage: () => Pick<Storage, 'getItem' | 'setItem'>) {
	let completed = false
	return {
		hasSeen() {
			try { return completed || getStorage().getItem(SESSION_KEY) === '1' }
			catch { return completed }
		},
		complete() {
			completed = true
			try { getStorage().setItem(SESSION_KEY, '1') } catch { /* memory fallback for this tab */ }
		},
	}
}

export function rasterSize(width: number, height: number, dpr: number) {
	const scale = Math.min(Math.max(1, dpr), 1280 / width, 1280 / height, Math.sqrt(921600 / (width * height)))
	return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) }
}

// A small coverage grid counts the union of strokes, never repeated passes over the same area.
export function coverCircle(grid: Uint8Array, x: number, y: number, radius: number, width: number, height: number) {
	const cols = 80, rows = 50
	for (let row = Math.max(0, Math.floor((y - radius) / height * rows)); row < Math.min(rows, Math.ceil((y + radius) / height * rows)); row++) {
		for (let col = Math.max(0, Math.floor((x - radius) / width * cols)); col < Math.min(cols, Math.ceil((x + radius) / width * cols)); col++) {
			if (Math.hypot((col + .5) / cols * width - x, (row + .5) / rows * height - y) <= radius) grid[row * cols + col] = 1
		}
	}
	return grid.reduce((sum, value) => sum + value, 0) / grid.length
}

// One completion path for success/error/timeout; disposer makes late image events harmless.
export function waitForImage(image: HTMLImageElement, src: string, ready: (loaded: boolean) => void, timeout = 3000) {
	let active = true
	const finish = (loaded: boolean) => {
		if (!active) return
		active = false
		clearTimeout(timer)
		image.onload = image.onerror = null
		ready(loaded)
	}
	const timer = setTimeout(() => finish(false), timeout)
	image.onload = () => finish(image.naturalWidth > 0)
	image.onerror = () => finish(false)
	image.src = src
	if (image.complete) finish(image.naturalWidth > 0)
	return () => { active = false; clearTimeout(timer); image.onload = image.onerror = null }
}
