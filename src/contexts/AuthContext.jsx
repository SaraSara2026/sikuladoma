// AuthContext drží aktuálního uživatele a poskytuje akce login/register/logout.
// Při startu aplikace zavolá /api/auth/me, aby zjistil, jestli máme platnou session.
//
// Použití:
//   <AuthProvider><App /></AuthProvider>
//   const { user, login, register, logout, loading } = useAuth();

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { apiLogin, apiRegister, apiLogout, apiMe } from '../lib/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    apiMe()
      .then(({ user }) => { if (alive) setUser(user) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    setError(null)
    try {
      const { user } = await apiLogin({ email, password })
      setUser(user)
      return user
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const register = useCallback(async (data) => {
    setError(null)
    try {
      const { user } = await apiRegister(data)
      setUser(user)
      return user
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth musí být uvnitř <AuthProvider>.')
  return ctx
}
