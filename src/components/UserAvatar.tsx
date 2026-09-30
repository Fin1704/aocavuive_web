'use client'

import { useState } from 'react'
import { getServerUrl } from '../config/api'

export default function UserAvatar({ src, name, size = 40, className = '' }: {
	src?: string | null
	name: string
	size?: number
	className?: string
}) {
	const [failedSrc, setFailedSrc] = useState<string | null>(null)
	let url = ''
	try {
		if (src?.trim()) {
			const resolved = new URL(src.trim(), `${getServerUrl().replace(/\/$/, '')}/`)
			if (['https:', 'http:'].includes(resolved.protocol)) url = resolved.href
		}
	} catch { /* Invalid URLs use the same fallback as unavailable images. */ }
	return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-700 font-bold text-white ${className}`}
		style={{ width: size, height: size }}>
		{url && failedSrc !== url ? <img key={url} src={url} alt={name} width={size} height={size}
			referrerPolicy='no-referrer' onError={() => setFailedSrc(url)} className='h-full w-full object-cover' />
			: <span role='img' aria-label={`Ảnh đại diện của ${name}`}>{name.trim().charAt(0).toUpperCase() || '?'}</span>}
	</span>
}
