import type { UserAccount } from '../services/authService'
import CurrencyIcon from './CurrencyIcon'

export default function CurrencyBalances({ account, className = '' }: {
	account?: UserAccount | null
	className?: string
}) {
	return <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`} aria-label='Số dư tiền tệ'>
		{(['so', 'gold'] as const).map(currency => {
			const amount = currency === 'so' ? account?.shells : account?.gold
			return <span key={currency} className='inline-flex items-center gap-1 whitespace-nowrap'>
				<CurrencyIcon currency={currency} size={20} />
				<span>{amount == null ? '—' : Number(amount).toLocaleString('vi-VN')} {currency === 'so' ? 'Sò' : 'Vàng'}</span>
			</span>
		})}
	</div>
}
