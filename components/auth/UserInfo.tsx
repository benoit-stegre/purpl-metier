'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogoutButton } from './LogoutButton'

interface User {
  email: string
  role?: string
}

export function UserInfo() {
  const [user, setUser] = useState<User | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({
          email: user.email || '',
          role: user.user_metadata?.role || 'user'
        })
      }
    }
    getUser()
  }, [])

  if (!user) return null

  const isAdmin = user.role === 'admin' || user.email === 'benoit@purplsolutions.com'

  return (
    <div className="flex items-center gap-3">
      
      {/* Bouton Admin (visible seulement pour admin) */}
      {isAdmin && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all"
            style={{ 
              color: '#FFFEF5',
              backgroundColor: '#ED693A',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E77E55'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ED693A'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Admin
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showMenu ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {/* Menu déroulant */}
          {showMenu && (
            <div 
              className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-2 z-50"
              style={{ backgroundColor: '#EDEAE3', border: '1px solid #D6CCAF' }}
            >
              <Link
                href="/dashboard/admin/invite"
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: '#2F2F2E' }}
                onClick={() => setShowMenu(false)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D6CCAF40'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
                Inviter un utilisateur
              </Link>
              
              <Link
                href="/dashboard/admin/users"
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: '#2F2F2E' }}
                onClick={() => setShowMenu(false)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D6CCAF40'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Gérer les utilisateurs
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Info utilisateur */}
      <div className="text-right">
        <p className="text-sm font-medium" style={{ color: '#FFFEF5' }}>
          {user.email}
        </p>
        {isAdmin && (
          <p className="text-xs" style={{ color: '#ED693A' }}>
            Administrateur
          </p>
        )}
      </div>
      
      <LogoutButton 
        className="!border-white/30 !text-white hover:!bg-white/20"
      />
    </div>
  )
}
