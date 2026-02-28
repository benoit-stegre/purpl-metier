import { createClient } from '@/lib/supabase/server'

/**
 * Vérifie si l'utilisateur actuellement connecté a le rôle admin
 * via la table sécurisée user_roles (non modifiable par l'utilisateur)
 */
export async function isUserAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (error || !userRole) return false

  return userRole.role === 'admin'
}

/**
 * Vérifie si l'utilisateur actuellement connecté a le rôle admin (version client-side)
 * Utilise le client Supabase côté navigateur
 */
export async function isUserAdminClient(supabaseClient: ReturnType<typeof import('@supabase/ssr').createBrowserClient>): Promise<boolean> {
  const { data: { user } } = await supabaseClient.auth.getUser()

  if (!user) return false

  const { data: userRole, error } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (error || !userRole) return false

  return userRole.role === 'admin'
}
