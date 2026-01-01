import 'es-module-lexer';
import './chunks/shared_9gEenf6c.mjs';
import { appendForwardSlash, removeTrailingForwardSlash } from '@astrojs/internal-helpers/path';
import 'piccolore';
import { o as originPathnameSymbol, A as AstroError, F as ForbiddenRewrite } from './chunks/astro/server_CPswtaYA.mjs';
import 'clsx';
import 'html-escaper';
import { l as languages, d as defaultLang } from './chunks/ui_D1kxox_O.mjs';

function shouldAppendForwardSlash(trailingSlash, buildFormat) {
  switch (trailingSlash) {
    case "always":
      return true;
    case "never":
      return false;
    case "ignore": {
      switch (buildFormat) {
        case "directory":
          return true;
        case "preserve":
        case "file":
          return false;
      }
    }
  }
}

function setOriginPathname(request, pathname, trailingSlash, buildFormat) {
  if (!pathname) {
    pathname = "/";
  }
  const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
  let finalPathname;
  if (pathname === "/") {
    finalPathname = "/";
  } else if (shouldAppendSlash) {
    finalPathname = appendForwardSlash(pathname);
  } else {
    finalPathname = removeTrailingForwardSlash(pathname);
  }
  Reflect.set(request, originPathnameSymbol, encodeURIComponent(finalPathname));
}

function getParams(route, pathname) {
  if (!route.params.length) return {};
  const paramsMatch = route.pattern.exec(pathname) || route.fallbackRoutes.map((fallbackRoute) => fallbackRoute.pattern.exec(pathname)).find((x) => x);
  if (!paramsMatch) return {};
  const params = {};
  route.params.forEach((key, i) => {
    if (key.startsWith("...")) {
      params[key.slice(3)] = paramsMatch[i + 1] ? paramsMatch[i + 1] : void 0;
    } else {
      params[key] = paramsMatch[i + 1];
    }
  });
  return params;
}

const apiContextRoutesSymbol = Symbol.for("context.routes");

function sequence(...handlers) {
  const filtered = handlers.filter((h) => !!h);
  const length = filtered.length;
  if (!length) {
    return defineMiddleware((_context, next) => {
      return next();
    });
  }
  return defineMiddleware((context, next) => {
    let carriedPayload = void 0;
    return applyHandle(0, context);
    function applyHandle(i, handleContext) {
      const handle = filtered[i];
      const result = handle(handleContext, async (payload) => {
        if (i < length - 1) {
          if (payload) {
            let newRequest;
            if (payload instanceof Request) {
              newRequest = payload;
            } else if (payload instanceof URL) {
              newRequest = new Request(payload, handleContext.request.clone());
            } else {
              newRequest = new Request(
                new URL(payload, handleContext.url.origin),
                handleContext.request.clone()
              );
            }
            const oldPathname = handleContext.url.pathname;
            const pipeline = Reflect.get(handleContext, apiContextRoutesSymbol);
            const { routeData, pathname } = await pipeline.tryRewrite(
              payload,
              handleContext.request
            );
            if (pipeline.serverLike === true && handleContext.isPrerendered === false && routeData.prerender === true) {
              throw new AstroError({
                ...ForbiddenRewrite,
                message: ForbiddenRewrite.message(
                  handleContext.url.pathname,
                  pathname,
                  routeData.component
                ),
                hint: ForbiddenRewrite.hint(routeData.component)
              });
            }
            carriedPayload = payload;
            handleContext.request = newRequest;
            handleContext.url = new URL(newRequest.url);
            handleContext.params = getParams(routeData, pathname);
            handleContext.routePattern = routeData.route;
            setOriginPathname(
              handleContext.request,
              oldPathname,
              pipeline.manifest.trailingSlash,
              pipeline.manifest.buildFormat
            );
          }
          return applyHandle(i + 1, handleContext);
        } else {
          return next(payload ?? carriedPayload);
        }
      });
      return result;
    }
  });
}

function defineMiddleware(fn) {
  return fn;
}

function getBrowserLanguage(request) {
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {});
    if (cookies["language"] && cookies["language"] in languages) {
      return cookies["language"];
    }
  }
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferredLanguages = acceptLanguage.split(",").map((lang) => {
      const [locale, quality = "1"] = lang.trim().split(";q=");
      return {
        locale: locale.toLowerCase(),
        quality: parseFloat(quality)
      };
    }).sort((a, b) => b.quality - a.quality);
    for (const { locale } of preferredLanguages) {
      if (locale in languages) {
        return locale;
      }
      const langPrefix = locale.split("-")[0];
      if (langPrefix in languages) {
        return langPrefix;
      }
      if (langPrefix === "zh" && "zh-cn" in languages) {
        return "zh-cn";
      }
    }
  }
  return defaultLang;
}
function createLanguageCookie(locale) {
  return `language=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

const onRequest$1 = defineMiddleware((context, next) => {
  const { request, url } = context;
  if (url.pathname === "/" || url.pathname === "") {
    const acceptLang = request.headers.get("accept-language");
    const cookie = request.headers.get("cookie");
    if (!acceptLang && !cookie) {
      return next();
    }
    try {
      const targetLang = getBrowserLanguage(request);
      const redirectUrl = new URL(`/${targetLang}/`, url);
      return new Response(null, {
        status: 302,
        headers: {
          "Location": redirectUrl.toString(),
          "Set-Cookie": createLanguageCookie(targetLang)
        }
      });
    } catch (e) {
      return next();
    }
  }
  return next();
});

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
