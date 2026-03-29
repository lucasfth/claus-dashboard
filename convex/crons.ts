import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval(
  'delete activities older than two days',
  { hours: 1 },
  internal.activities.deleteOlderThanTwoDays,
)

crons.interval(
  'archive tasks done for 5 days',
  { hours: 1 },
  internal.tasks.archiveOldDone,
)

export default crons
