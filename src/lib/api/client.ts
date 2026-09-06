// Cliente HTTP para chamadas à API
export async function apiFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Erro na requisição')
  }
  return data as T
}
