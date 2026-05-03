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

export const preferredLangFromHeader = (
  acceptLanguage: string | null | undefined,
  fallback: Lang = defaultLang
): Lang => {
  if (!acceptLanguage) return fallback;

  const preferences = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;

      return {
        tag: tag.toLowerCase(),
        q: Number.isFinite(q) ? q : 0,
        index
      };
    })
    .filter((preference) => preference.tag && preference.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const { tag } of preferences) {
    const primaryTag = tag.split('-')[0];

    if (isLang(tag)) return tag;
    if (isLang(primaryTag)) return primaryTag;
  }

  return fallback;
};

export const dictionary = {
  zh: {
    siteTitle: "Rownix's Blog",
    siteDescription: '一个记录量化交易、市场结构、宏观变化和产业案例的分析博客。',
    nav: {
      home: '首页',
      articles: '文章',
      topics: '主题',
      about: '关于',
      sponsor: '赞助'
    },
    heroLabel: '市场结构 · 策略研究 · 风险管理',
    heroTitle: '拆解技术、产业、市场与风险。',
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
    articleMeta: {
      updated: '更新'
    },
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
    aboutDescription: '这里记录我对技术、产业、市场和风险的长期观察。',
    aboutSections: [
      {
        title: '写什么',
        body:
          '这个博客不只写市场，也会写 AI、基础设施、公司案例、宏观变量、支付网络和交易机制。主题看起来分散，但核心问题相似：一个系统如何运转，哪些变量真正改变结果，风险又藏在哪里。'
      },
      {
        title: '怎么写',
        body:
          '我更关心结构，而不是热闹的结论。文章会尽量把观点拆回数据锚点、机制约束、执行条件和失效边界；如果一个判断无法被复盘、被质疑、被修正，它就不值得写得太确定。'
      },
      {
        title: '为什么写',
        body:
          '写作是整理判断的方式。很多问题单独看像新闻，放长一点看才会露出产业周期、商业模式、技术路径和人群行为的变化。这个博客用来沉淀这些观察，也方便以后回头检查自己哪里看对了，哪里看错了。'
      }
    ],
    socialTitle: '联系与频道',
    legal: {
      title: '法律与隐私',
      privacy: '隐私政策',
      cookies: 'Cookie 说明',
      terms: '使用条款',
      updated: '更新日期'
    },
    sponsor: {
      title: '赞助这个博客',
      eyebrow: 'Sponsor',
      intro:
        '如果这些文章对你的研究、交易复盘或产业理解有帮助，可以用一笔小额赞助支持后续写作。收款服务将通过第三方服务提供。',
      amountLabel: '赞助金额',
      amountHelp: '也可以输入自定义金额，范围 1.00 到 5000.00。',
      methodLabel: '支付方式',
      methods: {
        alipay: '支付宝',
        wxpay: '微信支付',
        crypto: '加密货币'
      },
      cryptoPriceNote:
        '加密货币收款服务将通过第三方服务提供，支付信息以第三方收银台显示为准。',
      submit: '前往支付',
      success: '支付完成后你已返回本站，感谢支持。',
      privacyPrefix: '本站只生成订单和签名，不在本页面收集银行卡或钱包密码。点击"前往支付"即表示你已阅读并同意',
      privacyJoin: '与',
      privacySuffix: '，并同意本站按隐私政策处理必要的支付相关数据。'
    },
    share: {
      title: '分享文章',
      native: '分享',
      copy: '复制链接',
      copied: '已复制',
      email: '邮件'
    },
    comments: {
      title: '评论',
      loading: '正在加载评论。',
      empty: '还没有评论，欢迎留下第一条想法。',
      disabled: '评论区还没有配置完成。',
      nameLabel: '昵称',
      namePlaceholder: '你的昵称',
      emailLabel: '邮箱（可选，不公开）',
      emailPlaceholder: 'you@example.com',
      bodyLabel: '评论',
      bodyPlaceholder: '写下你的想法',
      submit: '提交评论',
      submitting: '提交中',
      success: '评论已发布。',
      error: '评论暂时无法提交，请稍后再试。'
    },
    errorPage: {
      eyebrow: '页面走丢了',
      title: '这里没有可阅读的内容。',
      copy: '链接可能已经失效，文章地址可能输入错误，也可能是内容还没有发布。你可以回到首页，或从最近文章继续浏览。',
      home: '返回首页',
      articles: '查看文章',
      latest: '最近文章',
      detail: '错误代码'
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
      about: 'About',
      sponsor: 'Sponsor'
    },
    heroLabel: 'Market Structure · Strategy Research · Risk Management',
    heroTitle: 'Analyzing technology, industry, markets, and risk.',
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
    articleMeta: {
      updated: 'Updated'
    },
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
    aboutDescription:
      'Long-form notes on technology, industry, markets, and risk.',
    aboutSections: [
      {
        title: 'What I write about',
        body:
          'This blog is not only about markets. It also covers AI, infrastructure, company cases, macro variables, payment networks, and trading mechanics. The topics may look scattered, but the underlying question is usually the same: how a system works, which variables actually change outcomes, and where risk is hidden.'
      },
      {
        title: 'How I write',
        body:
          'I care more about structure than loud conclusions. Each piece tries to trace an argument back to data anchors, mechanism constraints, execution conditions, and failure boundaries. If a claim cannot be reviewed, challenged, or corrected later, it should not be written with too much certainty.'
      },
      {
        title: 'Why I write',
        body:
          'Writing is a way to organize judgment. Many questions look like news in isolation, but reveal changes in industry cycles, business models, technology paths, and human behavior over time. This blog is where I keep those observations and later check what I got right and what I missed.'
      }
    ],
    socialTitle: 'Contact and channels',
    legal: {
      title: 'Legal and privacy',
      privacy: 'Privacy Policy',
      cookies: 'Cookie Notice',
      terms: 'Terms of Use',
      updated: 'Updated'
    },
    sponsor: {
      title: 'Sponsor This Blog',
      eyebrow: 'Sponsor',
      intro:
        'If the writing helps your research, trading review, or industry thinking, you can support future posts with a small contribution. Collection services are provided through third-party services.',
      amountLabel: 'Amount',
      amountHelp: 'You can also enter a custom amount from 1.00 to 5000.00.',
      methodLabel: 'Payment Method',
      methods: {
        alipay: 'Alipay',
        wxpay: 'WeChat Pay',
        crypto: 'Crypto'
      },
      cryptoPriceNote:
        'Crypto collection services are provided through third-party services. Payment details are shown at the third-party checkout.',
      submit: 'Continue to Payment',
      success: 'You have returned after payment. Thank you for the support.',
      privacyPrefix:
        'This site only creates the order and signature; card or wallet credentials are handled by the payment provider. By clicking "Continue to Payment" you confirm you have read and agree to the',
      privacyJoin: 'and',
      privacySuffix: ', and consent to the processing of necessary payment data as described in the Privacy Policy.'
    },
    share: {
      title: 'Share article',
      native: 'Share',
      copy: 'Copy link',
      copied: 'Copied',
      email: 'Email'
    },
    comments: {
      title: 'Comments',
      loading: 'Loading comments.',
      empty: 'No comments yet. Be the first to add one.',
      disabled: 'Comments are not configured yet.',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      emailLabel: 'Email (optional, not public)',
      emailPlaceholder: 'you@example.com',
      bodyLabel: 'Comment',
      bodyPlaceholder: 'Share your thoughts',
      submit: 'Post comment',
      submitting: 'Posting',
      success: 'Your comment has been posted.',
      error: 'Comments are temporarily unavailable. Try again later.'
    },
    errorPage: {
      eyebrow: 'Page not found',
      title: 'There is nothing to read here.',
      copy: 'The link may be outdated, the article address may be incorrect, or the content may not be published yet. Return home or continue with recent articles.',
      home: 'Back home',
      articles: 'View articles',
      latest: 'Recent articles',
      detail: 'Error code'
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
