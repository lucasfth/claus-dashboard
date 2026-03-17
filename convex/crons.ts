import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval(
  'delete activities older than two days',
  { hours: 1 },
  internal.activities.deleteOlderThanTwoDays,
)

crons.interval(
  'delete tasks older than two days',
  { hours: 6 },
  internal.tasks.deleteOlderThanTwoDays,
)

export default crons
