import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userIdToDelete } = await params

    // Vérifier que l'utilisateur est admin
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const isAdmin = user.user_metadata?.role === 'admin' || 
                    user.email === 'benoit@purplsolutions.com'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Empêcher la suppression de soi-même
    if (userIdToDelete === user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' }, 
        { status: 400 }
      )
    }

    // Empêcher la suppression du compte admin principal
    const adminClient = createAdminClient()
    
    // Vérifier l'email de l'utilisateur à supprimer
    const { data: { user: userToDelete }, error: getUserError } = 
      await adminClient.auth.admin.getUserById(userIdToDelete)

    if (getUserError || !userToDelete) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    if (userToDelete.email === 'benoit@purplsolutions.com') {
      return NextResponse.json(
        { error: 'Impossible de supprimer le compte administrateur principal' }, 
        { status: 400 }
      )
    }

    // Supprimer l'utilisateur
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userIdToDelete)

    if (deleteError) {
      console.error('Erreur suppression:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Utilisateur ${userToDelete.email} supprimé` 
    })

  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


