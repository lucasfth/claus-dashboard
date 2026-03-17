import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'

const BRIDGE_SECRET = process.env.BRIDGE_SECRET

function checkSecret(request: Request): Response | null {
  if (!BRIDGE_SECRET || request.headers.get('x-bridge-secret') !== BRIDGE_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}

const pushActivity = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err

  const body = await request.json().catch(() => null)
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })

  const validTypes = ['telegram', 'cron', 'github', 'briefing', 'misc']
  const type = validTypes.includes(body.type) ? body.type : 'misc'

  await ctx.runMutation(internal.activities.insertInternal, {
    type,
    summary: body.summary ?? 'unknown',
    details: body.details,
  })

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

const pushJobs = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err

  const body = await request.json().catch(() => null)
  if (!Array.isArray(body)) return new Response(JSON.stringify({ error: 'Expected array' }), { status: 400 })

  await ctx.runMutation(internal.jobs.upsertMany, { jobs: body })

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

const getContext = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err

  const note = await ctx.runQuery(internal.context.getInternal, {})

  return new Response(
    JSON.stringify({ content: note?.content ?? '', updatedAt: note?.updatedAt ?? null }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})

const http = httpRouter()
http.route({ path: '/pushActivity', method: 'POST', handler: pushActivity })
http.route({ path: '/pushJobs', method: 'POST', handler: pushJobs })
http.route({ path: '/getContext', method: 'GET', handler: getContext })

export default http
