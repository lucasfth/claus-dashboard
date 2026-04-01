import { getAuthUserId } from '@convex-dev/auth/server'
import type { QueryCtx, MutationCtx } from '../_generated/server'
import { ConvexError } from 'convex/values'

export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const userId = await getAuthUserId(ctx)
  if (userId === null) throw new ConvexError('Unauthorized')

  const access = await ctx.db
    .query('userAccess')
    .withIndex('by_userId', q => q.eq('userId', userId))
    .unique()
  if (!access?.approved) throw new ConvexError('Access denied')

  return userId
}
