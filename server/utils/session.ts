import { H3Event, getCookie, setCookie, deleteCookie } from 'h3'
import { randomBytes, createHmac } from 'crypto'
import prisma from './prisma'
import { isUserSuspended } from './account-state'

const SESSION_COOKIE = 'pp_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

function getSecret(): string {
  const config = useRuntimeConfig()
  return config.sessionSecret as string
}

function signToken(sessionId: string): string {
  const secret = getSecret()
  const sig = createHmac('sha256', secret).update(sessionId).digest('hex')
  return `${sessionId}.${sig}`
}

function verifyToken(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [sessionId, sig] = parts
  const secret = getSecret()
  const expected = createHmac('sha256', secret).update(sessionId).digest('hex')
  if (sig !== expected) return null
  return sessionId
}

export async function createSession(event: H3Event, userId: string) {
  const sessionId = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE)

  await prisma.session.create({
    data: { id: sessionId, userId, expiresAt },
  })

  const token = signToken(sessionId)
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE / 1000,
  })
}

export async function getUserSession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null

  const sessionId = verifyToken(token)
  if (!sessionId) return null

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: { omit: { passwordHash: true } } },
  })

  if (!session) return null
  if (await isUserSuspended(session.userId)) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
    deleteCookie(event, SESSION_COOKIE)
    return null
  }
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } })
    deleteCookie(event, SESSION_COOKIE)
    return null
  }

  return session
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    const sessionId = verifyToken(token)
    if (sessionId) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
    }
  }
  deleteCookie(event, SESSION_COOKIE)
}
