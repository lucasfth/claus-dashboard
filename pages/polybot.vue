<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const runs = useConvexQuery(api.polybot.listRuns, {})
const topMarkets = useConvexQuery(api.polybot.latestTopMarkets, {})

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function shortRunId(id: string): string {
  return id.length > 12 ? id.slice(0, 12) + '…' : id
}

const stats = computed(() => {
  if (!runs.value) return null
  const totalRuns = runs.value.length
  const totalAnalyses = runs.value.reduce((s, r) => s + r.analysesGenerated, 0)
  const totalTrades = runs.value.reduce((s, r) => s + r.tradesExecuted, 0)
  const lastRun = runs.value[0] ?? null
  return { totalRuns, totalAnalyses, totalTrades, lastRun }
})

function scoreColor(score: number): string {
  if (score >= 0.7) return 'bg-green-500'
  if (score >= 0.4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function scoreTextColor(score: number): string {
  if (score >= 0.7) return 'text-green-400'
  if (score >= 0.4) return 'text-yellow-400'
  return 'text-red-400'
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold">Polybot</h1>
      <p class="text-xs text-gray-600 mt-1">Dry run &mdash; 2 weeks from 2026-03-21</p>
    </div>

    <!-- Stats row -->
    <div v-if="runs === undefined" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-gray-900/50 animate-pulse" />
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="rounded-lg bg-gray-900/30 border border-gray-800/50 px-4 py-3">
        <p class="text-xs text-gray-600 mb-1">Total runs</p>
        <p class="text-2xl font-semibold">{{ stats?.totalRuns ?? 0 }}</p>
      </div>
      <div class="rounded-lg bg-gray-900/30 border border-gray-800/50 px-4 py-3">
        <p class="text-xs text-gray-600 mb-1">Analyses</p>
        <p class="text-2xl font-semibold">{{ stats?.totalAnalyses ?? 0 }}</p>
      </div>
      <div class="rounded-lg bg-gray-900/30 border border-gray-800/50 px-4 py-3">
        <p class="text-xs text-gray-600 mb-1">Trades (dry)</p>
        <p class="text-2xl font-semibold">{{ stats?.totalTrades ?? 0 }}</p>
      </div>
      <div class="rounded-lg bg-gray-900/30 border border-gray-800/50 px-4 py-3">
        <p class="text-xs text-gray-600 mb-1">Last run</p>
        <p class="text-sm font-medium truncate">
          {{ stats?.lastRun ? relativeTime(stats.lastRun.startedAt) : '—' }}
        </p>
      </div>
    </div>

    <!-- Top markets -->
    <div class="mb-6">
      <h2 class="text-sm font-medium text-gray-400 mb-3">Top markets now</h2>

      <div v-if="topMarkets === undefined" class="space-y-2">
        <div v-for="i in 5" :key="i" class="h-10 rounded-lg bg-gray-900/50 animate-pulse" />
      </div>

      <p v-else-if="topMarkets.length === 0" class="text-gray-600 text-sm">No market data yet.</p>

      <div v-else class="rounded-lg bg-gray-900/30 border border-gray-800/50 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-800/50">
              <th class="text-left px-4 py-2 text-xs text-gray-600 font-medium">Market</th>
              <th class="text-right px-4 py-2 text-xs text-gray-600 font-medium w-32">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in topMarkets"
              :key="m._id"
              class="border-b border-gray-800/30 last:border-0"
            >
              <td class="px-4 py-2.5 text-xs text-gray-300 truncate max-w-0 w-full">
                <span :title="m.marketQuestion">{{ m.marketQuestion.length > 80 ? m.marketQuestion.slice(0, 80) + '…' : m.marketQuestion }}</span>
              </td>
              <td class="px-4 py-2.5 w-32">
                <div class="flex items-center gap-2 justify-end">
                  <span :class="['text-xs font-mono', scoreTextColor(m.score)]">{{ m.score.toFixed(2) }}</span>
                  <div class="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      :class="['h-full rounded-full', scoreColor(m.score)]"
                      :style="{ width: `${Math.min(m.score * 100, 100)}%` }"
                    />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent runs -->
    <div>
      <h2 class="text-sm font-medium text-gray-400 mb-3">Recent runs</h2>

      <div v-if="runs === undefined" class="space-y-2">
        <div v-for="i in 4" :key="i" class="h-14 rounded-lg bg-gray-900/50 animate-pulse" />
      </div>

      <p v-else-if="runs.length === 0" class="text-gray-600 text-sm">No runs yet.</p>

      <div v-else class="space-y-2">
        <div
          v-for="run in runs"
          :key="run._id"
          class="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-900/30 border border-gray-800/50"
        >
          <span
            class="inline-block text-xs px-2 py-0.5 rounded font-mono border shrink-0"
            :class="run.dryRun
              ? 'bg-blue-900/50 text-blue-300 border-blue-800/50'
              : 'bg-green-900/50 text-green-300 border-green-800/50'"
          >{{ run.dryRun ? 'dry' : 'live' }}</span>

          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2">
              <span class="text-xs font-mono text-gray-400">{{ shortRunId(run.runId) }}</span>
              <span class="text-xs text-gray-600">{{ relativeTime(run.startedAt) }}</span>
            </div>
            <div class="flex gap-4 mt-0.5">
              <span class="text-xs text-gray-600">{{ run.totalMarkets }} markets</span>
              <span class="text-xs text-gray-600">{{ run.analysesGenerated }} analyses</span>
              <span class="text-xs text-gray-600">{{ run.tradesExecuted }} trades</span>
            </div>
          </div>

          <span class="text-xs text-gray-700 shrink-0">
            {{ Math.round((run.finishedAt - run.startedAt) / 1000) }}s
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
