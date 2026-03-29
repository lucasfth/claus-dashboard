import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

async function allocateTaskId(ctx: any): Promise<number> {
  const counter = await ctx.db
    .query("counters")
    .withIndex("by_name", (q: any) => q.eq("name", "taskId"))
    .first();
  if (!counter) {
    await ctx.db.insert("counters", { name: "taskId", value: 1 });
    return 1;
  }
  const next = counter.value + 1;
  await ctx.db.patch(counter._id, { value: next });
  return next;
}

// Returns all non-archived tasks for the kanban board
export const list = query({
  args: {},
  handler: async (ctx) => {
    const statuses = [
      "todo",
      "in_progress",
      "done",
      "pending",
      "cancelled",
    ] as const;
    const all: any[] = [];
    for (const s of statuses) {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("status", s))
        .collect();
      all.push(...tasks);
    }
    return all.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getTask = query({
  args: { taskId: v.number() },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
    if (!task) return null;
    const notes = await ctx.db
      .query("taskNotes")
      .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
      .order("asc")
      .collect();
    return { ...task, notes };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    runAt: v.optional(v.number()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    labels: v.optional(v.array(v.string())),
    githubLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const taskId = await allocateTaskId(ctx);
    await ctx.db.insert("tasks", {
      taskId,
      title: args.title.trim().slice(0, 100) || "task",
      description: args.description.trim().slice(0, 10000),
      runAt: args.runAt,
      status: "todo",
      createdAt: Date.now(),
      priority: args.priority,
      labels: args.labels,
      githubLink: args.githubLink,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { status: args.status };
    if (args.status === "done") {
      patch.movedToDoneAt = Date.now();
    }
    await ctx.db.patch(args.id, patch);
  },
});

export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    title: v.string(),
    description: v.string(),
    runAt: v.optional(v.number()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    labels: v.optional(v.array(v.string())),
    githubLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    if (task.status === "archived")
      throw new Error("Cannot edit archived tasks");

    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const effectiveRunAt = args.runAt ?? task.runAt;
    if (effectiveRunAt && task.status === "todo") {
      const timeUntilRun = effectiveRunAt - Date.now();
      if (timeUntilRun < FIVE_MINUTES_MS) {
        throw new Error(
          "Scheduled time must be at least 5 minutes in the future",
        );
      }
    }

    const patch: Record<string, unknown> = {
      title: args.title.trim().slice(0, 100) || "task",
      description: args.description.trim().slice(0, 10000),
      priority: args.priority,
      labels: args.labels,
      githubLink: args.githubLink,
    };
    if (args.runAt !== undefined) patch.runAt = args.runAt;
    await ctx.db.patch(args.id, patch);
  },
});

export const cancel = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "cancelled" });
  },
});

// Used by Bridget to fetch tasks ready to execute
export const listPending = internalQuery({
  args: {},
  handler: async (ctx) => {
    const todo = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "todo"))
      .collect();
    // Also pick up legacy 'pending' status tasks
    const legacy = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return [...todo, ...legacy];
  },
});

export const markDone = internalMutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "done", movedToDoneAt: Date.now() });
  },
});

export const markInProgress = internalMutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "in_progress" });
  },
});

export const addNoteInternal = internalMutation({
  args: {
    taskNumericId: v.number(),
    content: v.string(),
    author: v.union(v.literal("lucas"), v.literal("claus")),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskNumericId))
      .first();
    if (!task) throw new Error(`Task T-${args.taskNumericId} not found`);
    const now = Date.now();
    await ctx.db.insert("taskNotes", {
      taskId: task._id,
      content: args.content.trim(),
      author: args.author,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getTaskInternal = internalQuery({
  args: { taskNumericId: v.number() },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskNumericId))
      .first();
    if (!task) return null;
    const notes = await ctx.db
      .query("taskNotes")
      .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
      .order("asc")
      .collect();
    return { ...task, notes };
  },
});

// Cron: archive tasks that have been in 'done' for 5+ days
export const archiveOldDone = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - FIVE_DAYS_MS;
    const doneTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "done"))
      .take(BATCH_SIZE);
    let archivedCount = 0;
    for (const task of doneTasks) {
      if (task.movedToDoneAt && task.movedToDoneAt <= cutoff) {
        await ctx.db.patch(task._id, { status: "archived" });
        archivedCount++;
      }
    }
    return { archivedCount };
  },
});

// One-time migration: pending→todo, name→title, prompt→description, assign taskIds
export const migrate = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allTasks = await ctx.db.query("tasks").collect();
    let counter = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", "taskId"))
      .first();
    let nextId = counter?.value ?? 0;
    let migratedCount = 0;

    const sorted = [...allTasks].sort((a, b) => a.createdAt - b.createdAt);
    for (const task of sorted) {
      const patch: Record<string, unknown> = {};
      if (!task.taskId) {
        nextId++;
        patch.taskId = nextId;
        migratedCount++;
      }
      if (!(task as any).title && (task as any).name) {
        patch.title = (task as any).name;
      }
      if (!(task as any).description && (task as any).prompt) {
        patch.description = (task as any).prompt;
      }
      if ((task as any).status === "pending") {
        patch.status = "todo";
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(task._id, patch);
      }
    }

    if (counter) {
      await ctx.db.patch(counter._id, { value: nextId });
    } else if (nextId > 0) {
      await ctx.db.insert("counters", { name: "taskId", value: nextId });
    }
    return { migratedCount, nextId };
  },
});

// Legacy no-op — replaced by archiveOldDone in crons
export const deleteOlderThanTwoDays = internalMutation({
  args: {},
  handler: async (_ctx) => ({ deletedCount: 0 }),
});
