/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_clustering from "../ai/clustering.js";
import type * as ai_embedding from "../ai/embedding.js";
import type * as ai_linkFetcher from "../ai/linkFetcher.js";
import type * as ai_nodeLinker from "../ai/nodeLinker.js";
import type * as auth from "../auth.js";
import type * as captures from "../captures.js";
import type * as edges from "../edges.js";
import type * as http from "../http.js";
import type * as linkMetadata from "../linkMetadata.js";
import type * as model_captures from "../model/captures.js";
import type * as model_users from "../model/users.js";
import type * as nodeDocuments from "../nodeDocuments.js";
import type * as nodeLinker from "../nodeLinker.js";
import type * as nodes from "../nodes.js";
import type * as scripts_seedAgentUser from "../scripts/seedAgentUser.js";
import type * as search from "../search.js";
import type * as suggestions from "../suggestions.js";
import type * as topics from "../topics.js";
import type * as utils_customFunctions from "../utils/customFunctions.js";
import type * as utils_errors from "../utils/errors.js";
import type * as utils_helpers from "../utils/helpers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/clustering": typeof ai_clustering;
  "ai/embedding": typeof ai_embedding;
  "ai/linkFetcher": typeof ai_linkFetcher;
  "ai/nodeLinker": typeof ai_nodeLinker;
  auth: typeof auth;
  captures: typeof captures;
  edges: typeof edges;
  http: typeof http;
  linkMetadata: typeof linkMetadata;
  "model/captures": typeof model_captures;
  "model/users": typeof model_users;
  nodeDocuments: typeof nodeDocuments;
  nodeLinker: typeof nodeLinker;
  nodes: typeof nodes;
  "scripts/seedAgentUser": typeof scripts_seedAgentUser;
  search: typeof search;
  suggestions: typeof suggestions;
  topics: typeof topics;
  "utils/customFunctions": typeof utils_customFunctions;
  "utils/errors": typeof utils_errors;
  "utils/helpers": typeof utils_helpers;
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
    lib: {
      enqueueWebhookEvent: FunctionReference<
        "mutation",
        "internal",
        {
          apiKey: string;
          event: string;
          eventId: string;
          eventTypes?: Array<string>;
          logLevel?: "DEBUG";
          onEventHandle?: string;
          updatedAt?: string;
        },
        any
      >;
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
    };
  };
};
