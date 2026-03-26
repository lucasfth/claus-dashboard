/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as bridget from "../bridget.js";
import type * as chatMessages from "../chatMessages.js";
import type * as commands from "../commands.js";
import type * as context from "../context.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as messages from "../messages.js";
import type * as polybot from "../polybot.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  bridget: typeof bridget;
  chatMessages: typeof chatMessages;
  commands: typeof commands;
  context: typeof context;
  crons: typeof crons;
  http: typeof http;
  jobs: typeof jobs;
  messages: typeof messages;
  polybot: typeof polybot;
  tasks: typeof tasks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
