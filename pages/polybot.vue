<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const runs = useConvexQuery(api.polybot.listRuns, {})
const topMarkets = useConvexQuery(api.polybot.latestTopMarkets, {})
const trades = useConvexQuery(api.polybot.listTrades, {})

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function shortRunId(id: string): string {
  return id.length > 12 ? id.slice(0, 12) + '\u2026' : id
}

const stats = computed(() => {
  if (!runs.value) return null
  const totalRuns = runs.value.length
  const totalAnalyses = runs.value.reduce((s, r) => s + r.analysesGenerated, 0)
  const totalTrades = runs.value.reduce((s, r) => s + r.tradesExecuted, 0)
  const lastRun = runs.value[0] ?? null
  return { totalRuns, totalAnalyses, totalTrades, lastRun }
})

const pnl = computed(() => {
  if (!trades.value) return null
  const isBuy = (side: string) => side.toLowerCase() === 'buy' || side.toLowerCase().includes('yes')
  const isSell = (side: string) => side.toLowerCase() === 'sell' || side.toLowerCase().includes('no')
  const deployed = trades.value.filter(t => t.success && isBuy(t.side)).reduce((s, t) => s + t.sizeUsd, 0)
  const returned = trades.value.filter(t => t.success && isSell(t.side)).reduce((s, t) => s + t.sizeUsd, 0)
  const net = returned - deployed
  return { deployed, returned, net }
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

function imbalanceLabel(v: number | undefined): string {
  if (v == null) return ''
  if (v > 0.15) return '\u25b2 buy'
  if (v < -0.15) return '\u25bc sell'
  return '\u2014 neutral'
}

function imbalanceColor(v: number | undefined): string {
  if (v == null) return 'text-gray-600'
  if (v > 0.15) return 'text-green-500'
  if (v < -0.15) return 'text-red-500'
  return 'text-gray-500'
}

function annotationStyle(ann: string): string {
  if (ann.includes('divergence') || ann.includes('reversal')) return 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800/40'
  if (ann.includes('top trader')) return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800/40'
  if (ann.includes('spike')) return 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800/40'
  if (ann.includes('VWAP')) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800/40'
  if (ann.includes('buy pressure')) return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800/40'
  if (ann.includes('sell pressure')) return 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800/40'
  if (ann.includes('large trade')) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800/40'
  return 'bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700/40'
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold">Polybot</h1>
      <p class="text-xs text-gray-500 dark:text-gray-600 mt-1">Dry run &mdash; 2 weeks from 2026-03-21</p>
    </div>

    <!-- Stats row -->
    <div v-if="runs === undefined" class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      <div v-for="i in 5" :key="i" class="h-16 rounded-lg bg-gray-200 dark:bg-gray-900/50 animate-pulse" />
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      <div class="rounded-lg bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50 px-4 py-3">
        <p class="text-xs text-gray-500 dark:text-gray-600 mb-1">Total runs</p>
        <p class="text-2xl font-semibold">{{ stats?.totalRuns ?? 0 }}</p>
      </div>
      <div class="rounded-lg bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50 px-4 py-3">
        <p class="text-xs text-gray-500 dark:text-gray-600 mb-1">Analyses</p>
        <p class="text-2xl font-semibold">{{ stats?.totalAnalyses ?? 0 }}</p>
      </div>
      <div class="rounded-lg bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50 px-4 py-3">
        <p class="text-xs text-gray-500 dark:text-gray-600 mb-1">Trades (dry)</p>
        <p class="text-2xl font-semibold">{{ stats?.totalTrades ?? 0 }}</p>
      </div>
      <div class="rounded-lg bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50 px-4 py-3">
        <p class="text-xs text-gray-500 dark:text-gray-600 mb-1">Last run</p>
        <p class="text-sm font-medium truncate">
          {{ stats?.lastRun ? relativeTime(stats.lastRun.startedAt * 1000) : '\u2014' }}
        </p>
      </div>
      <!-- P&L stat -->
      <div
        class="rounded-lg border px-4 py-3"
        :class="pnl && pnl.net > 0
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40'
          : pnl && pnl.net < 0
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
            : 'bg-white dark:bg-gray-900/30 border-gray-200 dark:border-gray-800/50'"
      >
        <p class="text-xs text-gray-500 dark:text-gray-600 mb-1">Sim P&amp;L</p>
        <p
          class="text-2xl font-semibold font-mono"
          :class="pnl && pnl.net > 0 ? 'text-green-600 dark:text-green-400' : pnl && pnl.net < 0 ? 'text-red-600 dark:text-red-400' : ''"
        >
          <template v-if="pnl">
            {{ pnl.net >= 0 ? '+' : '' }}${{ pnl.net.toFixed(2) }}
          </template>
          <template v-else>\u2014</template>
        </p>
        <p v-if="pnl" class="text-xs text-gray-500 dark:text-gray-600 mt-0.5">
          in ${{ pnl.deployed.toFixed(2) }} / out ${{ pnl.returned.toFixed(2) }}
        </p>
      </div>
    </div>

    <!-- Top markets -->
    <div class="mb-6">
      <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Top markets now</h2>

      <div v-if="topMarkets === undefined" class="space-y-2">
        <div v-for="i in 5" :key="i" class="h-10 rounded-lg bg-gray-200 dark:bg-gray-900/50 animate-pulse" />
      </div>

      <p v-else-if="topMarkets.length === 0" class="text-gray-500 dark:text-gray-600 text-sm">No market data yet.</p>

      <div v-else class="rounded-lg bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800/50">
              <th class="text-left px-4 py-2 text-xs text-gray-500 dark:text-gray-600 font-medium">Market</th>
              <th class="text-right px-4 py-2 text-xs text-gray-500 dark:text-gray-600 font-medium">Imbalance</th>
              <th class="text-right px-4 py-2 text-xs text-gray-500 dark:text-gray-600 font-medium">Spike</th>
              <th class="text-right px-4 py-2 text-xs text-gray-500 dark:text-gray-600 font-medium w-32">Score</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="m in topMarkets" :key="m._id">
              <tr class="border-b border-gray-100 dark:border-gray-800/20">
                <td class="px-4 pt-2.5 pb-1 text-xs text-gray-700 dark:text-gray-300 truncate max-w-0 w-full">
                  <span :title="m.marketQuestion">{{ m.marketQuestion.length > 70 ? m.marketQuestion.slice(0, 70) + '\u2026' : m.marketQuestion }}</span>
                </td>
                <td class="px-4 pt-2.5 pb-1 text-xs font-mono whitespace-nowrap" :class="imbalanceColor(m.imbalance)">
                  {{ imbalanceLabel(m.imbalance) }}
                </td>
                <td class="px-4 pt-2.5 pb-1 text-xs font-mono text-right whitespace-nowrap">
                  <span v-if="m.spikeFactor != null" :class="m.spikeFactor > 1.5 ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-gray-600'">
                    {{ m.spikeFactor.toFixed(1) }}x
                  </span>
                  <span v-else class="text-gray-300 dark:text-gray-700">\u2014</span>
                </td>
                <td class="px-4 pt-2.5 pb-1 w-32">
                  <div class="flex items-center gap-2 justify-end">
                    <span :class="['text-xs font-mono', scoreTextColor(m.score)]">{{ m.score.toFixed(2) }}</span>
                    <div class="w-16 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        :class="['h-full rounded-full', scoreColor(m.score)]"
                        :style="{ width: `${Math.min(m.score * 100, 100)}%` }"
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <!-- Annotations row -->
              <tr v-if="m.annotations && m.annotations.length > 0" class="border-b border-gray-100 dark:border-gray-800/30 last:border-0">
                <td colspan="4" class="px-4 pb-2.5">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="ann in m.annotations"
                      :key="ann"
                      :class="['text-xs px-2 py-0.5 rounded border', annotationStyle(ann)]"
                    >{{ ann }}</span>
                  </div>
                </td>
              </tr>
              <tr v-else class="border-b border-gray-100 dark:border-gray-800/30 last:border-0"><td colspan="4" class="pb-1" /></tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dry-run trade log -->
    <div class="mb-6">
      <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Dry-run trade log</h2>

      <div v-if="trades === undefined" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-10 rounded-lg bg-gray-200 dark:bg-gray-900/50 animate-pulse" />
      </div>

      <p v-else-if="trades.length === 0" class="text-gray-500 dark:text-gray-600 text-sm">No trades yet.</p>

      <div v-else class="rounded-lg bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800/50">
              <th class="text-left px-4 py-2 text-xs text-gray-500 dark:text-gray-600 font-medium">Market</th>
              <th class="text-right px-4 py-2 text-xs text-gray-500 dark:text-gray-600 font-medium">Side</th>
              <th class="text-right px-4 py-2 text-xs text-gray-500 dark:text-gray-600 font-medium">Size</th>
              <th class="text-right px-4 py-2 text-xs text-gray-500 dark:text-gray-600 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t in trades"
              :key="t._id"
              class="border-b border-gray-100 dark:border-gray-800/30 last:border-0"
            >
              <td class="px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 truncate max-w-0 w-full">
                <span :title="t.marketQuestion ?? t.marketId">{{ (t.marketQuestion ?? t.marketId).slice(0, 60) }}{{ (t.marketQuestion ?? t.marketId).length > 60 ? '\u2026' : '' }}</span>
              </td>
              <td class="px-4 py-2.5 text-xs font-mono text-right whitespace-nowrap">
                <span :class="t.side.toLowerCase().includes('yes') || t.side === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">{{ t.side }}</span>
              </td>
              <td class="px-4 py-2.5 text-xs font-mono text-right whitespace-nowrap text-gray-500 dark:text-gray-400">${{ t.sizeUsd.toFixed(2) }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-400 dark:text-gray-600 text-right whitespace-nowrap">{{ relativeTime(t.timestamp * 1000) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent runs -->
    <div>
      <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recent runs</h2>

      <div v-if="runs === undefined" class="space-y-2">
        <div v-for="i in 4" :key="i" class="h-14 rounded-lg bg-gray-200 dark:bg-gray-900/50 animate-pulse" />
      </div>

      <p v-else-if="runs.length === 0" class="text-gray-500 dark:text-gray-600 text-sm">No runs yet.</p>

      <div v-else class="space-y-2">
        <div
          v-for="run in runs"
          :key="run._id"
          class="flex items-center gap-3 px-4 py-3 rounded-lg bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50"
        >
          <span
            class="inline-block text-xs px-2 py-0.5 rounded font-mono border shrink-0"
            :class="run.dryRun
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800/50'
              : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800/50'"
          >{{ run.dryRun ? 'dry' : 'live' }}</span>

          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2">
              <span class="text-xs font-mono text-gray-500 dark:text-gray-400">{{ shortRunId(run.runId) }}</span>
              <span class="text-xs text-gray-400 dark:text-gray-600">{{ relativeTime(run.startedAt * 1000) }}</span>
            </div>
            <div class="flex gap-4 mt-0.5">
              <span class="text-xs text-gray-400 dark:text-gray-600">{{ run.totalMarkets }} markets</span>
              <span class="text-xs text-gray-400 dark:text-gray-600">{{ run.analysesGenerated }} analyses</span>
              <span class="text-xs text-gray-400 dark:text-gray-600">{{ run.tradesExecuted }} trades</span>
            </div>
          </div>

          <span class="text-xs text-gray-300 dark:text-gray-700 shrink-0">
            {{ Math.round((run.finishedAt - run.startedAt)) }}s
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
