'use client'

import { useState } from 'react'

export default function InvitePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'envoi')
        return
      }

      setSuccess(`Invitation envoyée à ${email}`)
      setEmail('')
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 
            className="text-xl sm:text-2xl font-semibold"
            style={{ color: '#2F2F2E' }}
          >
            Inviter un utilisateur
          </h1>
          <p 
            className="mt-2 text-sm"
            style={{ color: '#76715A' }}
          >
            L'utilisateur recevra un email avec un lien pour créer son compte.
          </p>
        </div>

        {/* Card formulaire */}
        <div 
          className="rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm"
          style={{ backgroundColor: '#EDEAE3' }}
        >
          <form onSubmit={handleInvite} className="space-y-5">
            
            {/* Message succès */}
            {success && (
              <div 
                className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ 
                  backgroundColor: '#76715A20',
                  color: '#76715A',
                  border: '1px solid #76715A40'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {success}
              </div>
            )}

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

            {/* Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#76715A' }}
              >
                Email de l'utilisateur à inviter
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg font-medium transition-all focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#FFFEF5',
                  border: '2px solid #D6CCAF',
                  color: '#2F2F2E',
                }}
                placeholder="collegue@entreprise.com"
                disabled={loading}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-4 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: loading ? '#E77E55' : '#ED693A',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#E77E55')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#ED693A')}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Envoyer l'invitation
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div 
            className="mt-6 p-4 rounded-lg text-sm"
            style={{ backgroundColor: '#D6CCAF30' }}
          >
            <p style={{ color: '#76715A' }}>
              <strong>Comment ça marche ?</strong>
            </p>
            <ol className="mt-2 space-y-1 list-decimal list-inside" style={{ color: '#76715A' }}>
              <li>L'utilisateur reçoit un email d'invitation</li>
              <li>Il clique sur le lien dans l'email</li>
              <li>Il définit son mot de passe</li>
              <li>Il peut accéder au dashboard</li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  )
}

