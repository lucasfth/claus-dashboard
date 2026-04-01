import { Password } from '@convex-dev/auth/providers/Password'
import { convexAuth } from '@convex-dev/auth/server'

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      // Only create access record for new users
      if (args.existingUserId !== null) return
      await ctx.db.insert('userAccess', {
        userId: args.userId,
        approved: false,
      })
    },
  },
})
