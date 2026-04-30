export const languages = ['zh', 'en'] as const;
export type Lang = (typeof languages)[number];

export const defaultLang: Lang = 'zh';

export const languageNames: Record<Lang, string> = {
  zh: '中文',
  en: 'English'
};

export const languageOptions = [
  { code: 'zh', name: '中文', available: true },
  { code: 'en', name: 'English', available: true },
  { code: 'ja', name: '日本語', available: false },
  { code: 'es', name: 'Español', available: false }
] as const;

export const isLang = (value: string | undefined): value is Lang =>
  languages.includes(value as Lang);

export const dictionary = {
  zh: {
    siteTitle: "Rownix's Blog",
    siteDescription: '一个记录量化交易、市场结构、宏观变化和产业案例的分析博客。',
    nav: {
      home: '首页',
      articles: '文章',
      topics: '主题',
      about: '关于'
    },
    heroLabel: '市场结构 · 策略研究 · 风险管理',
    heroTitle: '把复杂市场问题拆成可验证的分析。',
    heroCopy:
      '这里关注量化策略、衍生品机制、宏观变量和产业变化。每篇文章都尽量从数据锚点、交易约束和风险边界出发，而不是停留在简单观点。',
    latest: '最新文章',
    search: {
      label: '搜索文章',
      open: '搜索',
      close: '关闭搜索',
      placeholder: '搜索标题、主题或摘要',
      results: '篇匹配文章',
      noResults: '没有找到匹配的文章',
      clear: '清空搜索',
      showing: '搜索',
      total: '共',
      viewAll: '查看全部文章',
      topic: '主题'
    },
    featured: '精选',
    readArticle: '阅读全文',
    minutes: '分钟阅读',
    pagination: {
      label: '文章分页',
      previous: '上一页',
      next: '下一页',
      page: '第 {page} 页',
      status: '第 {current} / {total} 页'
    },
    backToTop: '回到顶部',
    toc: {
      title: '目录',
      show: '展开目录',
      hide: '收起目录'
    },
    allTopics: '全部主题',
    aboutTitle: '关于这个博客',
    aboutCopy:
      '这里记录对市场、策略和产业的长期观察：先理解结构，再讨论机会；先定义风险，再谈收益。页面保持轻量，内容保持可迁移，并为后续英文、日语和西班牙语版本预留空间。',
    socialTitle: '联系与频道',
    share: {
      title: '分享文章',
      native: '分享',
      copy: '复制链接',
      copied: '已复制',
      email: '邮件'
    },
    notFound: '没有找到这篇文章。',
    switchLanguage: '切换语言',
    languageSoon: '待支持'
  },
  en: {
    siteTitle: "Rownix's Blog",
    siteDescription:
      'An analytical blog on systematic trading, market structure, macro shifts, and industry cases.',
    nav: {
      home: 'Home',
      articles: 'Articles',
      topics: 'Topics',
      about: 'About'
    },
    heroLabel: 'Market Structure · Strategy Research · Risk Management',
    heroTitle: 'Breaking complex markets into testable analysis.',
    heroCopy:
      'This blog focuses on quantitative strategy, derivative mechanics, macro variables, and industry change, grounding each piece in data anchors, trading constraints, and risk boundaries instead of simple market takes.',
    latest: 'Latest Articles',
    search: {
      label: 'Search articles',
      open: 'Search',
      close: 'Close search',
      placeholder: 'Search title, topic, or summary',
      results: 'matching posts',
      noResults: 'No matching articles found',
      clear: 'Clear search',
      showing: 'Search',
      total: 'total',
      viewAll: 'View all articles',
      topic: 'Topic'
    },
    featured: 'Featured',
    readArticle: 'Read article',
    minutes: 'min read',
    pagination: {
      label: 'Article pagination',
      previous: 'Previous',
      next: 'Next',
      page: 'Page {page}',
      status: 'Page {current} of {total}'
    },
    backToTop: 'Back to top',
    toc: {
      title: 'Contents',
      show: 'Show contents',
      hide: 'Hide contents'
    },
    allTopics: 'All topics',
    aboutTitle: 'About this blog',
    aboutCopy:
      'Long-form notes on markets, strategy, and industry: understand structure before opportunity, define risk before return. The interface stays light, the content stays portable, and the publishing system leaves room for English, Japanese, and Spanish editions.',
    socialTitle: 'Contact and channels',
    share: {
      title: 'Share article',
      native: 'Share',
      copy: 'Copy link',
      copied: 'Copied',
      email: 'Email'
    },
    notFound: 'This article could not be found.',
    switchLanguage: 'Switch language',
    languageSoon: 'Soon'
  }
} satisfies Record<Lang, Record<string, unknown>>;

export const t = (lang: Lang) => dictionary[lang];

export const localizePath = (lang: Lang, path = '/') => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${lang}${normalized === '/' ? '' : normalized}`;
};
