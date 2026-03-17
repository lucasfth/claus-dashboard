export default defineEventHandler(async (event) => {
  return oauthGitHubEventHandler({
    config: {
      scope: ['user:email'],
    },
    async onSuccess(event, { user }) {
      if (user.login !== 'lucasfth') {
        throw createError({ statusCode: 403, statusMessage: 'Unauthorized' })
      }
      await setUserSession(event, {
        user: {
          id: user.id,
          login: user.login,
          avatar: user.avatar_url,
        },
      })
      return sendRedirect(event, '/feed')
    },
    onError(event, error) {
      console.error('GitHub OAuth error:', error)
      return sendRedirect(event, '/login?error=1')
    },
  })(event)
})
