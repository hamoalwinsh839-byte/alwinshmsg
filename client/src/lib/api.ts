import { useQuery, useMutation, type UseQueryOptions } from "@tanstack/react-query";

// ─── HTTP helper ─────────────────────────────────────────────────────────────
async function apiRequest<T>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const error = new Error((err as { message?: string }).message ?? res.statusText) as Error & { status: number };
    error.status = res.status;
    throw error;
  }
  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface User { id: number; username: string }
export interface Token { id: number; userId: number; tokenValue: string; label: string | null; status: string; createdAt: string }
export interface Task { id: number; userId: number; tokenId: number; serverId: string | null; channelId: string; message: string; imagePath: string | null; scheduleTime: string; intervalSeconds: number | null; isActive: boolean; sentCount: number; nextRunAt: string | null; createdAt: string }
export interface Log { id: number; taskId: number; channelId: string; status: string; errorMessage: string | null; sentAt: string }
export interface Stats { totalTokens: number; activeTokens: number; totalTasks: number; activeTasks: number; totalSent: number; successRate: number }

// ─── Query key factories ──────────────────────────────────────────────────────
export const getGetMeQueryKey = () => ["auth-me"] as const;
export const getListTokensQueryKey = () => ["tokens"] as const;
export const getListTasksQueryKey = () => ["tasks"] as const;
export const getListLogsQueryKey = () => ["logs"] as const;
export const getGetStatsQueryKey = () => ["stats"] as const;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export function useGetMe(opts?: { query?: Partial<UseQueryOptions<User>> }) {
  return useQuery<User>({
    queryKey: opts?.query?.queryKey ?? getGetMeQueryKey(),
    queryFn: () => apiRequest<User>("GET", "/api/auth/me"),
    retry: opts?.query?.retry ?? 1,
    ...opts?.query,
  });
}

export function useLogin() {
  return useMutation<User, Error, { data: { username: string; password: string } }>({
    mutationFn: ({ data }) => apiRequest<User>("POST", "/api/auth/login", data),
  });
}

export function useRegister() {
  return useMutation<User, Error, { data: { username: string; password: string } }>({
    mutationFn: ({ data }) => apiRequest<User>("POST", "/api/auth/register", data),
  });
}

export function useLogout() {
  return useMutation<{ message: string }, Error, undefined>({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
  });
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
export function useListTokens(opts?: { query?: Partial<UseQueryOptions<Token[]>> }) {
  return useQuery<Token[]>({
    queryKey: opts?.query?.queryKey ?? getListTokensQueryKey(),
    queryFn: () => apiRequest<Token[]>("GET", "/api/tokens"),
    ...opts?.query,
  });
}

export function useCreateToken() {
  return useMutation<Token, Error, { data: { tokenValue: string; label?: string } }>({
    mutationFn: ({ data }) => apiRequest<Token>("POST", "/api/tokens", data),
  });
}

export function useDeleteToken() {
  return useMutation<{ message: string }, Error, { id: number }>({
    mutationFn: ({ id }) => apiRequest("DELETE", `/api/tokens/${id}`),
  });
}

export function useTestToken() {
  return useMutation<{ valid: boolean; message: string }, Error, { id: number }>({
    mutationFn: ({ id }) => apiRequest("POST", `/api/tokens/${id}/test`),
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export function useListTasks(opts?: { query?: Partial<UseQueryOptions<Task[]>> }) {
  return useQuery<Task[]>({
    queryKey: opts?.query?.queryKey ?? getListTasksQueryKey(),
    queryFn: () => apiRequest<Task[]>("GET", "/api/tasks"),
    ...opts?.query,
  });
}

export function useCreateTask() {
  return useMutation<Task, Error, { data: { tokenId: number; channelId: string; message: string; scheduleTime: string; serverId?: string; imagePath?: string; intervalSeconds?: number } }>({
    mutationFn: ({ data }) => apiRequest<Task>("POST", "/api/tasks", data),
  });
}

export function useDeleteTask() {
  return useMutation<{ message: string }, Error, { id: number }>({
    mutationFn: ({ id }) => apiRequest("DELETE", `/api/tasks/${id}`),
  });
}

export function useToggleTask() {
  return useMutation<Task, Error, { id: number }>({
    mutationFn: ({ id }) => apiRequest<Task>("POST", `/api/tasks/${id}/toggle`),
  });
}

export function useSendTaskNow() {
  return useMutation<{ success: boolean; message: string }, Error, { id: number }>({
    mutationFn: ({ id }) => apiRequest("POST", `/api/tasks/${id}/send`),
  });
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
export function useListLogs(opts?: { query?: Partial<UseQueryOptions<Log[]>> }) {
  return useQuery<Log[]>({
    queryKey: opts?.query?.queryKey ?? getListLogsQueryKey(),
    queryFn: () => apiRequest<Log[]>("GET", "/api/logs"),
    ...opts?.query,
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export function useGetStats(opts?: { query?: Partial<UseQueryOptions<Stats>> }) {
  return useQuery<Stats>({
    queryKey: opts?.query?.queryKey ?? getGetStatsQueryKey(),
    queryFn: () => apiRequest<Stats>("GET", "/api/stats"),
    ...opts?.query,
  });
}
