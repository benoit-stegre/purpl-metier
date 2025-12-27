'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Succès - rediriger vers le dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FFFEF5' }}>
      <div className="max-w-md w-full space-y-8">
        
        {/* Logo PURPL */}
        <div className="text-center">
          <div className="flex justify-center">
            <Image
              src="/logo-purpl.svg"
              alt="PURPL"
              width={22}
              height={7}
              className="h-auto w-auto"
              style={{ filter: 'brightness(0)' }}
              priority
            />
          </div>
        </div>

        {/* Card formulaire */}
        <div 
          className="rounded-2xl p-8 shadow-sm"
          style={{ backgroundColor: '#EDEAE3' }}
        >
          <h2 
            className="text-xl font-semibold mb-2 text-center"
            style={{ color: '#2F2F2E' }}
          >
            Bienvenue !
          </h2>
          <p 
            className="text-sm mb-6 text-center"
            style={{ color: '#76715A' }}
          >
            Définissez votre mot de passe pour activer votre compte
          </p>

          <form onSubmit={handleSetPassword} className="space-y-5">
            {/* Message d'erreur */}
            {error && (
              <div 
                className="px-4 py-3 rounded-lg text-sm font-medium"
                style={{ 
                  backgroundColor: '#C6846C20',
                  color: '#C6846C',
                  border: '1px solid #C6846C40'
                }}
              >
                {error}
              </div>
            )}

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#76715A' }}
              >
                Nouveau mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg font-medium transition-all focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#FFFEF5',
                  border: '2px solid #D6CCAF',
                  color: '#2F2F2E',
                }}
                placeholder="Minimum 8 caractères"
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#76715A' }}
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg font-medium transition-all focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#FFFEF5',
                  border: '2px solid #D6CCAF',
                  color: '#2F2F2E',
                }}
                placeholder="Répétez le mot de passe"
                disabled={loading}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: loading ? '#E77E55' : '#ED693A',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#E77E55')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#ED693A')}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Activation...
                </span>
              ) : (
                'Activer mon compte'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p 
          className="text-center text-xs font-medium"
          style={{ color: '#76715A' }}
        >
          PURPL Solutions © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}


