export const getServerUrl = (): string => {
	return process.env.NEXT_PUBLIC_API_URL ?? 'https://account.aocavuive.com'
}

export const getApiUrl = (path: string): string => {
	return `${getServerUrl()}/api/v1${path}`
}
