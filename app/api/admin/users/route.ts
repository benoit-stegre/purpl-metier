import { createAdminClient } from '@/lib/supabase/admin'
import { isUserAdmin } from '@/lib/utils/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const isAdmin = await isUserAdmin()

    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Récupérer les utilisateurs via admin client
    const adminClient = createAdminClient()
    
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Récupérer les rôles depuis la table user_roles (source de vérité)
    const { data: roles } = await adminClient
      .from('user_roles')
      .select('user_id, role')

    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || [])

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      email_confirmed_at: u.email_confirmed_at,
      last_sign_in_at: u.last_sign_in_at,
      role: roleMap.get(u.id) || 'user',
    }))

    return NextResponse.json({ users: formattedUsers })

  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


