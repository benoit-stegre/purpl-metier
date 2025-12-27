'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface InvitedUser {
  id: string
  email: string
  created_at: string
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  role: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<InvitedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  
  // Modal de confirmation
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: InvitedUser | null }>({
    open: false,
    user: null,
  })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchUsers()
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserEmail(user.email || null)
      }
    } catch (err) {
      console.error('Erreur getCurrentUser:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors du chargement')
        return
      }

      setUsers(data.users || [])
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.user) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${deleteModal.user.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la suppression')
        setDeleting(false)
        return
      }

      // Rafraîchir la liste
      setUsers(users.filter(u => u.id !== deleteModal.user?.id))
      setDeleteModal({ open: false, user: null })
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canDelete = (user: InvitedUser) => {
    // Ne peut pas supprimer soi-même ou l'admin principal
    return user.email !== currentUserEmail && user.email !== 'benoit@purplsolutions.com'
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#2F2F2E' }}>
              Gestion des utilisateurs
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#76715A' }}>
              {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
            </p>
          </div>

          <Link
            href="/dashboard/admin/invite"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all"
            style={{ backgroundColor: '#ED693A' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E77E55'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ED693A'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Inviter
          </Link>
        </div>

        {/* Message d'erreur global */}
        {error && (
          <div 
            className="mb-6 px-4 py-3 rounded-lg text-sm font-medium"
            style={{ 
              backgroundColor: '#C6846C20',
              color: '#C6846C',
              border: '1px solid #C6846C40'
            }}
          >
            {error}
          </div>
        )}

        {/* Contenu */}
        <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: '#EDEAE3' }}>
          
          {loading ? (
            <div className="p-8 text-center">
              <div 
                className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full mx-auto"
                style={{ borderColor: '#ED693A', borderTopColor: 'transparent' }}
              />
              <p className="mt-4 text-sm" style={{ color: '#76715A' }}>Chargement...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: '#76715A' }}>Aucun utilisateur</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#D6CCAF40' }}>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#76715A' }}>
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#76715A' }}>
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#76715A' }}>
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#76715A' }}>
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#76715A' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#D6CCAF' }}>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium" style={{ color: '#2F2F2E' }}>
                        {user.email}
                        {user.email === currentUserEmail && (
                          <span className="ml-2 text-xs" style={{ color: '#76715A' }}>(vous)</span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: '#76715A' }}>
                        Créé le {formatDate(user.created_at)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: user.role === 'admin' ? '#ED693A20' : '#76715A20',
                          color: user.role === 'admin' ? '#ED693A' : '#76715A'
                        }}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.email_confirmed_at ? (
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#76715A' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Actif
                        </span>
                      ) : (
                        <span className="text-xs font-medium" style={{ color: '#C6846C' }}>
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#76715A' }}>
                      {formatDate(user.last_sign_in_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canDelete(user) ? (
                        <button
                          onClick={() => setDeleteModal({ open: true, user })}
                          className="p-2 rounded-lg transition-all"
                          style={{ color: '#C6846C' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#C6846C20'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          title="Supprimer l'utilisateur"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: '#D6CCAF' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Modal de confirmation */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(47, 47, 46, 0.5)' }}>
          <div 
            className="max-w-md w-full rounded-2xl p-6 shadow-xl"
            style={{ backgroundColor: '#EDEAE3' }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#2F2F2E' }}>
              Confirmer la suppression
            </h3>
            <p className="text-sm mb-6" style={{ color: '#76715A' }}>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <strong style={{ color: '#2F2F2E' }}>{deleteModal.user.email}</strong> ?
              <br />
              Cette action est irréversible.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ 
                  color: '#76715A',
                  border: '1px solid #D6CCAF'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D6CCAF40'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: '#C6846C' }}
                onMouseEnter={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#B5735B')}
                onMouseLeave={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#C6846C')}
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Suppression...
                  </span>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
