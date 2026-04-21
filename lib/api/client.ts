export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type RequestOptions = RequestInit & {
  token?: string;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...init } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error ?? data?.message ?? response.statusText;
    throw new Error(message);
  }

  return data as T;
}
