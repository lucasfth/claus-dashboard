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
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const pushJobs = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const body = await request.json().catch(() => null)
  if (!Array.isArray(body)) return new Response(JSON.stringify({ error: 'Expected array' }), { status: 400 })
  await ctx.runMutation(internal.jobs.upsertMany, { jobs: body })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const pushCommands = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const body = await request.json().catch(() => null)
  if (!Array.isArray(body)) return new Response(JSON.stringify({ error: 'Expected array' }), { status: 400 })
  await ctx.runMutation(internal.commands.replaceAll, { commands: body })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const getCommands = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const commands = await ctx.runQuery(internal.commands.listInternal, {})
  return new Response(JSON.stringify(commands), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const deleteCommand = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const body = await request.json().catch(() => null)
  if (!body?.name) return new Response(JSON.stringify({ error: 'Missing name' }), { status: 400 })
  await ctx.runMutation(internal.commands.deleteByName, { name: body.name })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const pushBridgetStatus = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const body = await request.json().catch(() => null)
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  await ctx.runMutation(internal.bridget.upsertStatus, {
    lastSync: body.lastSync ?? Date.now(),
    jobsPushed: body.jobsPushed,
    commandsPushed: body.commandsPushed,
    activitiesPushed: body.activitiesPushed,
  })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
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

const getJobUpdates = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const pending = await ctx.runQuery(internal.jobs.listPending, {})
  const result = pending.map(j => ({ name: j.name, schedule: j.pendingSchedule, prompt: j.pendingPrompt }))
  return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const clearJobUpdate = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const body = await request.json().catch(() => null)
  if (!body?.name) return new Response(JSON.stringify({ error: 'Missing name' }), { status: 400 })
  await ctx.runMutation(internal.jobs.clearPending, {
    name: body.name,
    appliedSchedule: body.schedule,
    appliedPrompt: body.prompt,
  })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const getMessages = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const messages = await ctx.runQuery(internal.messages.listUnprocessed, {})
  return new Response(JSON.stringify(messages), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const markMessageProcessed = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const body = await request.json().catch(() => null)
  if (!body?.id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })
  await ctx.runMutation(internal.messages.markProcessed, { id: body.id })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const getTasks = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const tasks = await ctx.runQuery(internal.tasks.listPending, {})
  return new Response(JSON.stringify(tasks), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const markTaskDone = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const body = await request.json().catch(() => null)
  if (!body?.id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })
  await ctx.runMutation(internal.tasks.markDone, { id: body.id })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const pushPolybotRun = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const body = await request.json().catch(() => null)
  if (!body?.runId) return new Response(JSON.stringify({ error: 'Missing runId' }), { status: 400 })
  await ctx.runMutation(internal.polybot.upsertRun, {
    runId: body.runId,
    startedAt: body.startedAt ?? Date.now(),
    finishedAt: body.finishedAt ?? Date.now(),
    dryRun: body.dryRun ?? true,
    totalMarkets: body.totalMarkets ?? 0,
    analysesGenerated: body.analysesGenerated ?? 0,
    tradesExecuted: body.tradesExecuted ?? 0,
    successfulTrades: body.successfulTrades ?? 0,
    topMarkets: body.topMarkets ?? [],
    trades: body.trades ?? [],
  })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const pushPolybotRuns = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const body = await request.json().catch(() => null)
  if (!Array.isArray(body)) return new Response(JSON.stringify({ error: 'Expected array' }), { status: 400 })
  await ctx.runMutation(internal.polybot.upsertRuns, { runs: body })
  return new Response(JSON.stringify({ ok: true, count: body.length }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const clearPolybotData = httpAction(async (ctx, request) => {
  const err = checkSecret(request)
  if (err) return err
  const result = await ctx.runMutation(internal.polybot.clearAll, {})
  return new Response(JSON.stringify({ ok: true, deleted: result }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

const http = httpRouter()
http.route({ path: '/pushActivity', method: 'POST', handler: pushActivity })
http.route({ path: '/pushJobs', method: 'POST', handler: pushJobs })
http.route({ path: '/pushCommands', method: 'POST', handler: pushCommands })
http.route({ path: '/getCommands', method: 'GET', handler: getCommands })
http.route({ path: '/deleteCommand', method: 'POST', handler: deleteCommand })
http.route({ path: '/pushBridgetStatus', method: 'POST', handler: pushBridgetStatus })
http.route({ path: '/getContext', method: 'GET', handler: getContext })
http.route({ path: '/getJobUpdates', method: 'GET', handler: getJobUpdates })
http.route({ path: '/clearJobUpdate', method: 'POST', handler: clearJobUpdate })
http.route({ path: '/getMessages', method: 'GET', handler: getMessages })
http.route({ path: '/markMessageProcessed', method: 'POST', handler: markMessageProcessed })
http.route({ path: '/getTasks', method: 'GET', handler: getTasks })
http.route({ path: '/markTaskDone', method: 'POST', handler: markTaskDone })
http.route({ path: '/pushPolybotRun', method: 'POST', handler: pushPolybotRun })
http.route({ path: '/pushPolybotRuns', method: 'POST', handler: pushPolybotRuns })
http.route({ path: '/clearPolybotData', method: 'POST', handler: clearPolybotData })

export default http
