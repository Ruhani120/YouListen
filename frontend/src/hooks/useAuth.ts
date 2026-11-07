import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface LoginPayload { email: string; password: string }
interface RegisterPayload { displayName: string; username: string; email: string; password: string }

interface AuthResponse {
  user: { id: number; email: string; username: string; displayName: string | null; avatarUrl: string | null; role: string }
  token: string
}

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<AuthResponse>('/auth/login', payload)
      return data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      qc.clear()
      toast.success(`Welcome back, ${data.user.displayName || data.user.username}!`)
      navigate('/app/dashboard')
    },
    onError: () => {
      toast.error('Invalid email or password')
    },
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await api.post<AuthResponse>('/auth/register', payload)
      return data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      qc.clear()
      toast.success('Account created successfully!')
      navigate('/app/dashboard')
    },
    onError: () => {
      toast.error('Registration failed. Please try again.')
    },
  })
}

export function useLogout() {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  return () => {
    clearAuth()
    qc.clear()
    toast.success('Logged out successfully')
    navigate('/login')
  }
}
