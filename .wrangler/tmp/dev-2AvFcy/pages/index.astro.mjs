globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent } from '../chunks/astro/server_CkFWa3cY.mjs';
export { r as renderers } from '../chunks/_@astro-renderers_DdG-II5W.mjs';

const $$Astro = createAstro("https://www.rownix.dev");
const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const supportedLanguages = ["zh-cn", "en"];
  const defaultLanguage = "zh-cn";
  const cookieHeader = Astro2.request.headers.get("Cookie");
  let targetLang = defaultLanguage;
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});
    const cookieLang = cookies["language"];
    if (cookieLang && supportedLanguages.includes(cookieLang)) {
      targetLang = cookieLang;
    }
  } else {
    const acceptLanguage = Astro2.request.headers.get("Accept-Language");
    if (acceptLanguage) {
      const languages = acceptLanguage.split(",").map((lang) => {
        const [tag, weight] = lang.split(";q=");
        return {
          tag: tag.trim().toLowerCase(),
          weight: weight ? parseFloat(weight) : 1
        };
      }).sort((a, b) => b.weight - a.weight);
      for (const { tag } of languages) {
        if (supportedLanguages.includes(tag)) {
          targetLang = tag;
          break;
        }
        const prefix = tag.split("-")[0];
        if (supportedLanguages.includes(prefix)) {
          targetLang = prefix;
          break;
        }
        if (prefix === "zh") {
          targetLang = "zh-cn";
          break;
        }
      }
    }
  }
  return Astro2.redirect(`/${targetLang}/`, 302);
}, "/home/rownix/Project/Blog/src/pages/index.astro", void 0);

const $$file = "/home/rownix/Project/Blog/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
