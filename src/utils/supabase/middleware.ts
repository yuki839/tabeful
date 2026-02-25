import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value }) => supabaseResponse.cookies.set(name, value))
        },
      },
    }
  )

  // 重要: createServerClient と supabase.auth.getClaims() の間に
  // ロジックを挟まないこと。些細なミスでランダムにログアウトする
  // 不具合の原因になります。

  // 重要: getClaims() は削除しないこと
  const { data } = await supabase.auth.getClaims()

  const user = data?.claims

  const pathname = request.nextUrl.pathname
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/map') ||
    pathname.startsWith('/restaurant') ||
    pathname.startsWith('/api/restaurant') ||
    pathname.startsWith('/api/maps') ||
    pathname.startsWith('/api/address') ||
    pathname.startsWith('/api/address/autocomplete') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth')

  if (!user && !isPublicPath) {
    // 未ログインならログインページへリダイレクトする
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 重要: supabaseResponse はそのまま返すこと。
  // NextResponse.next() で新しいレスポンスを作る場合は:
  // 1. request を渡す
  //    const myNewResponse = NextResponse.next({ request })
  // 2. cookie を引き継ぐ
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. cookie は変更しない
  // 4. return myNewResponse
  // これを守らないと、ブラウザとサーバーの同期が崩れて
  // セッションが早期に切れる可能性があります。

  return supabaseResponse
}
