globalThis.process ??= {}; globalThis.process.env ??= {};
const VALID_INPUT_FORMATS = [
  "jpeg",
  "jpg",
  "png",
  "tiff",
  "webp",
  "gif",
  "svg",
  "avif"
];
const VALID_SUPPORTED_FORMATS = [
  "jpeg",
  "jpg",
  "png",
  "tiff",
  "webp",
  "gif",
  "svg",
  "avif"
];
const DEFAULT_OUTPUT_FORMAT = "webp";
const DEFAULT_HASH_PROPS = [
  "src",
  "width",
  "height",
  "format",
  "quality",
  "fit",
  "position"
];

const __viteBrowserExternal = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: 'Module' }));

export { DEFAULT_OUTPUT_FORMAT as D, VALID_INPUT_FORMATS as V, __viteBrowserExternal as _, VALID_SUPPORTED_FORMATS as a, DEFAULT_HASH_PROPS as b };
