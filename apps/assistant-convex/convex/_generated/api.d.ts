/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as captures from "../captures.js";
import type * as edges from "../edges.js";
import type * as http from "../http.js";
import type * as linkMetadata from "../linkMetadata.js";
import type * as nodeDocuments from "../nodeDocuments.js";
import type * as nodeLinker from "../nodeLinker.js";
import type * as nodes from "../nodes.js";
import type * as scripts_seed from "../scripts/seed.js";
import type * as search from "../search.js";
import type * as suggestions from "../suggestions.js";
import type * as toolRequests from "../toolRequests.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  captures: typeof captures;
  edges: typeof edges;
  http: typeof http;
  linkMetadata: typeof linkMetadata;
  nodeDocuments: typeof nodeDocuments;
  nodeLinker: typeof nodeLinker;
  nodes: typeof nodes;
  "scripts/seed": typeof scripts_seed;
  search: typeof search;
  suggestions: typeof suggestions;
  toolRequests: typeof toolRequests;
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

export declare const components: {
  workOSAuthKit: {
    backfill: {
      startBackfill: FunctionReference<
        "mutation",
        "internal",
        { apiKey: string; logLevel?: "DEBUG"; onEventHandle?: string },
        null
      >;
    };
    lib: {
      getAuthUser: FunctionReference<
        "query",
        "internal",
        { id: string },
        {
          createdAt: string;
          email: string;
          emailVerified: boolean;
          externalId?: null | string;
          firstName?: null | string;
          id: string;
          lastName?: null | string;
          lastSignInAt?: null | string;
          locale?: null | string;
          metadata: Record<string, any>;
          profilePictureUrl?: null | string;
          updatedAt: string;
        } | null
      >;
      onWebhookEvent: FunctionReference<
        "mutation",
        "internal",
        {
          apiKey: string;
          event: {
            context?: Record<string, any>;
            createdAt: string;
            data: Record<string, any>;
            event: string;
            id: string;
          };
          eventTypes?: Array<string>;
          logLevel?: "DEBUG";
          onEventHandle?: string;
        },
        null
      >;
    };
  };
};
