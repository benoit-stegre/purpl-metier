import { createAdminClient } from '@/lib/supabase/admin'
import { isUserAdmin } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userIdToDelete } = await params

    // Vérifier que l'utilisateur est admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin()

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

    const adminClient = createAdminClient()

    // Vérifier que l'utilisateur à supprimer n'est pas admin
    const { data: targetUserRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userIdToDelete)
      .single()

    if (targetUserRole?.role === 'admin') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un compte administrateur' }, 
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    const { data: { user: userToDelete }, error: getUserError } = 
      await adminClient.auth.admin.getUserById(userIdToDelete)

    if (getUserError || !userToDelete) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Supprimer l'utilisateur
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userIdToDelete)

    if (deleteError) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
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


