import { APIError } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // TODO: agregar Authorization header con JWT desde localStorage o cookies
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error: APIError = await response.json()
    throw error
  }

  return response.json() as Promise<T>
}
