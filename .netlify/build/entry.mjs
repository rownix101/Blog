import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_YiNmo-Gr.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/api/search-index.json.astro.mjs');
const _page1 = () => import('./pages/robots.txt.astro.mjs');
const _page2 = () => import('./pages/_lang_/404.astro.mjs');
const _page3 = () => import('./pages/_lang_/about.astro.mjs');
const _page4 = () => import('./pages/_lang_/authors.astro.mjs');
const _page5 = () => import('./pages/_lang_/authors/_---id_.astro.mjs');
const _page6 = () => import('./pages/_lang_/blog/_---id_.astro.mjs');
const _page7 = () => import('./pages/_lang_/blog/_---page_.astro.mjs');
const _page8 = () => import('./pages/_lang_/newsletter/confirmed.astro.mjs');
const _page9 = () => import('./pages/_lang_/privacy.astro.mjs');
const _page10 = () => import('./pages/_lang_/rss.xml.astro.mjs');
const _page11 = () => import('./pages/_lang_/tags.astro.mjs');
const _page12 = () => import('./pages/_lang_/tags/_---id_.astro.mjs');
const _page13 = () => import('./pages/_lang_/terms.astro.mjs');
const _page14 = () => import('./pages/_lang_.astro.mjs');
const _page15 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["src/pages/api/search-index.json.ts", _page0],
    ["src/pages/robots.txt.ts", _page1],
    ["src/pages/[lang]/404.astro", _page2],
    ["src/pages/[lang]/about.astro", _page3],
    ["src/pages/[lang]/authors/index.astro", _page4],
    ["src/pages/[lang]/authors/[...id].astro", _page5],
    ["src/pages/[lang]/blog/[...id].astro", _page6],
    ["src/pages/[lang]/blog/[...page].astro", _page7],
    ["src/pages/[lang]/newsletter/confirmed.astro", _page8],
    ["src/pages/[lang]/privacy.astro", _page9],
    ["src/pages/[lang]/rss.xml.ts", _page10],
    ["src/pages/[lang]/tags/index.astro", _page11],
    ["src/pages/[lang]/tags/[...id].astro", _page12],
    ["src/pages/[lang]/terms.astro", _page13],
    ["src/pages/[lang]/index.astro", _page14],
    ["src/pages/index.astro", _page15]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "1f38c89c-d336-420b-894a-05b0665797a0"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
