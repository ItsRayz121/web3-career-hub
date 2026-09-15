import { NextResponse, type NextRequest } from 'next/server'

// No auth required — personal-use app, all routes are open
export function proxy(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
