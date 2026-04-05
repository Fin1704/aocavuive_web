export const getServerUrl = (): string => {
	return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
}

export const getApiUrl = (path: string): string => {
	return `${getServerUrl()}/api/v1${path}`
}
