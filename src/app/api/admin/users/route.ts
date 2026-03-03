import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  // 1. Verify service role key is configured
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { message: 'Erro de configuração do servidor.' },
      { status: 500 }
    )
  }

  // 2. Verify the caller is an authenticated admin
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* ignored in route handlers */ }
        },
      },
    }
  )

  const { data: { user: callerAuth } } = await supabaseAuth.auth.getUser()
  if (!callerAuth) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 })
  }

  const { data: callerProfile } = await supabaseAuth
    .from('users')
    .select('role')
    .eq('id', callerAuth.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'admin') {
    return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 })
  }

  // 3. Parse request body
  const body = await request.json()
  const { email, password, fullName, phone, cpf, role, status } = body

  if (!email || !password || !fullName) {
    return NextResponse.json(
      { message: 'Email, senha e nome completo são obrigatórios.' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { message: 'A senha deve ter pelo menos 6 caracteres.' },
      { status: 400 }
    )
  }

  // 4. Create user with service role key (bypasses email confirmation)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone: phone || '',
    },
  })

  if (createError) {
    const msg = createError.message.includes('already been registered')
      ? 'Este e-mail já está cadastrado.'
      : createError.message
    return NextResponse.json({ message: msg }, { status: 400 })
  }

  if (!newAuthUser.user) {
    return NextResponse.json({ message: 'Erro ao criar conta.' }, { status: 500 })
  }

  // 5. Wait for handle_new_user trigger, then update role/status/cpf if needed
  const updates: Record<string, string> = {}
  if (role && role !== 'user') updates.role = role
  if (status && status !== 'pending') updates.status = status
  if (cpf) updates.cpf = cpf

  if (Object.keys(updates).length > 0) {
    await new Promise(r => setTimeout(r, 500))
    await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', newAuthUser.user.id)
  }

  // 6. Fetch and return the created profile
  await new Promise(r => setTimeout(r, 300))
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', newAuthUser.user.id)
    .single()

  if (!profile) {
    return NextResponse.json(
      {
        message: 'Conta criada mas perfil não encontrado. Recarregue a página.',
        id: newAuthUser.user.id,
      },
      { status: 201 }
    )
  }

  return NextResponse.json({
    id: profile.id,
    name: profile.full_name || '',
    fullName: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    role: profile.role || 'user',
    status: profile.status || 'pending',
    cpf: profile.cpf || undefined,
    address: profile.address || undefined,
    avatar: profile.avatar_url || null,
    referralCode: profile.referral_code || undefined,
    createdAt: profile.created_at || new Date().toISOString(),
    score: 0,
    totalValue: 0,
  }, { status: 201 })
}
