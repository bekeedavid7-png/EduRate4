import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  // First update the session
  const response = await updateSession(request)
  
  // Check if accessing protected routes
  const { pathname } = request.nextUrl
  
  // Create a Supabase client for auth check
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // eslint-disable-next-line no-console
    console.warn(
      '[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Skipping auth checks in proxy.',
    )
    return response
  }

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/evaluate', '/lecturer']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Admin-only routes
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // Lecturer-only routes
  const lecturerRoutes = ['/lecturer']
  const isLecturerRoute = lecturerRoutes.some(route => pathname.startsWith(route))

  // Student-only routes (dashboard and evaluate)
  const studentRoutes = ['/dashboard', '/evaluate']
  const isStudentRoute = studentRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  if (isAdminRoute && user?.user_metadata?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect lecturers trying to access student pages
  if (isStudentRoute && user?.user_metadata?.role === 'lecturer') {
    return NextResponse.redirect(new URL('/lecturer', request.url))
  }

  // Redirect students trying to access lecturer pages
  if (isLecturerRoute && user?.user_metadata?.role === 'student') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Redirect authenticated users away from auth pages
  const authRoutes = ['/auth/login', '/auth/sign-up']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  if (isAuthRoute && user) {
    const role = user.user_metadata?.role
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (role === 'lecturer') {
      return NextResponse.redirect(new URL('/lecturer', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
