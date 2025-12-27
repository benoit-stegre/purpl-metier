'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Vérification en cours...')
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Récupérer le hash fragment de l'URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        // Aussi vérifier les query params
        const queryParams = new URLSearchParams(window.location.search)
        const tokenHash = queryParams.get('token_hash')
        const queryType = queryParams.get('type')

        // Cas 1: Hash fragment avec tokens
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('Erreur setSession:', error)
            setStatus('error')
            setMessage('Erreur lors de la connexion')
            setTimeout(() => router.push('/login?error=session_error'), 2000)
            return
          }

          setStatus('success')
          setMessage('Compte activé ! Redirection...')
          setTimeout(() => router.push('/auth/set-password'), 1000)
          return
        }

        // Cas 2: Token hash en query param
        if (tokenHash && queryType) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: queryType as any,
          })

          if (error) {
            console.error('Erreur verifyOtp:', error)
            setStatus('error')
            setMessage('Lien invalide ou expiré')
            setTimeout(() => router.push('/login?error=invalid_token'), 2000)
            return
          }

          setStatus('success')
          setMessage('Vérification réussie ! Redirection...')
          setTimeout(() => router.push('/auth/set-password'), 1000)
          return
        }

        // Cas 3: Vérifier si déjà connecté
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setStatus('success')
          setMessage('Déjà connecté ! Redirection...')
          setTimeout(() => router.push('/auth/set-password'), 1000)
          return
        }

        // Aucun token trouvé
        setStatus('error')
        setMessage('Lien invalide')
        setTimeout(() => router.push('/login?error=no_token'), 2000)

      } catch (err) {
        console.error('Erreur:', err)
        setStatus('error')
        setMessage('Une erreur est survenue')
        setTimeout(() => router.push('/login?error=unknown'), 2000)
      }
    }

    handleAuth()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FFFEF5' }}>
      <div className="max-w-md w-full text-center space-y-6">
        
        <h1 className="text-4xl font-semibold tracking-wide" style={{ color: '#2F2F2E' }}>
          purpl
        </h1>

        <div className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: '#EDEAE3' }}>
          <div className="mb-4">
            {status === 'loading' && (
              <div 
                className="animate-spin h-12 w-12 border-4 border-t-transparent rounded-full mx-auto"
                style={{ borderColor: '#ED693A', borderTopColor: 'transparent' }}
              />
            )}
            {status === 'success' && (
              <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#76715A' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#C6846C' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            )}
          </div>

          <p className="text-lg font-medium" style={{ color: status === 'error' ? '#C6846C' : '#2F2F2E' }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}


