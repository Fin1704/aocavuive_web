import Image from 'next/image'

export const currencies = {
	gold: { src: '/currencies/gold.png', label: 'Vàng' },
	gpoint: { src: '/currencies/gpoint.png', label: 'G Point' },
	so: { src: '/currencies/so.png', label: 'Sò' },
} as const

export default function CurrencyIcon({ currency, size = 24, className = '', decorative = true }: {
	currency: keyof typeof currencies
	size?: number
	className?: string
	decorative?: boolean
}) {
	const asset = currencies[currency]
	return <Image src={asset.src} alt={decorative ? '' : asset.label} aria-hidden={decorative || undefined}
		width={size} height={size} sizes={`${size}px`} draggable={false}
		className={`inline-block shrink-0 object-contain ${className}`} style={{ width: size, height: size }} />
}
