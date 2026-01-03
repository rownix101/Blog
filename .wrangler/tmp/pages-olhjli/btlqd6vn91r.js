// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/",
    "/_server-islands/*",
    "/_image",
    "/api/friends/*"
  ],
  exclude: [
    "/_astro/*",
    "/.assetsignore",
    "/ads.txt",
    "/apple-touch-icon.png",
    "/favicon-96x96.png",
    "/favicon.ico",
    "/favicon.svg",
    "/giscus-theme.css",
    "/og-default.png",
    "/site.webmanifest",
    "/web-app-manifest-192x192.png",
    "/web-app-manifest-512x512.png",
    "/fonts/*",
    "/images/*",
    "/og/*",
    "/static/*",
    "/api/search-index/*",
    "/api/search-index.json",
    "/robots.txt",
    "/404",
    "/zh-cn/*",
    "/en/*"
  ]
};

// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/home/sokach/Project/Blog/.wrangler/tmp/pages-olhjli/bundledWorker-0.18206160688437123.mjs";
import { isRoutingRuleMatch } from "/home/sokach/Project/Blog/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/home/sokach/Project/Blog/.wrangler/tmp/pages-olhjli/bundledWorker-0.18206160688437123.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=btlqd6vn91r.js.map
