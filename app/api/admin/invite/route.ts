import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier que l'utilisateur est connecté et admin
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
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier le rôle admin
    const isAdmin = user.user_metadata?.role === 'admin' || 
                    user.email === 'benoit@purplsolutions.com'
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Accès non autorisé. Seuls les administrateurs peuvent inviter.' },
        { status: 403 }
      )
    }

    // 2. Récupérer l'email à inviter
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email invalide' },
        { status: 400 }
      )
    }

    // 3. Utiliser le client admin pour inviter
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (adminError) {
      console.error('Erreur création client admin:', adminError)
      return NextResponse.json(
        { error: 'Configuration serveur invalide. Vérifiez SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      )
    }

    const { data, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/confirm`,
      data: {
        invited_by: user.email,
        role: 'user',
      },
    })

    if (inviteError) {
      console.error('Erreur invitation:', inviteError)
      
      // Gérer les erreurs spécifiques
      if (inviteError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Cet email est déjà enregistré' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Invitation envoyée à ${email}`,
      data: {
        email: data.user?.email,
        invited_at: new Date().toISOString(),
      },
    })

  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}


