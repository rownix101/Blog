import type { Lang } from './i18n';

export type LegalPage = {
  title: string;
  description: string;
  updated: string;
  sections: {
    title: string;
    body: string[];
  }[];
};

export const legalPages = {
  zh: {
    privacy: {
      title: '隐私政策',
      description: '说明本站如何处理访问、搜索、赞助支付和联系相关的数据。',
      updated: '2026-05-01',
      sections: [
        {
          title: '数据控制者',
          body: [
            '本站由 Rownix 运营。关于隐私、数据访问、更正或删除请求，请发送邮件至 connect@rownix.dev。'
          ]
        },
        {
          title: '我们处理的数据',
          body: [
            '访问本站时，托管和安全服务可能会处理 IP 地址、设备与浏览器信息、访问时间、请求路径和错误日志，用于交付页面、安全防护、故障排查和滥用防范。',
            '站内搜索在浏览器内输入关键词，并可能请求本站搜索接口返回文章列表。本站目前不主动保存个人搜索历史。',
            '使用赞助功能时，本站会生成订单号、赞助金额、支付方式、签名、通知地址和返回地址，并把这些必要字段提交给第三方支付服务。银行卡、钱包密码、支付账户凭证等敏感支付信息由支付服务方处理，本站页面不收集这些信息。',
            '如果你主动通过邮件、社交账号或其他渠道联系本站，本站会处理你提供的联系方式和消息内容，以便回复。'
          ]
        },
        {
          title: '处理目的和法律依据',
          body: [
            '必要的访问日志和安全数据用于提供网站、维护服务可靠性和防止滥用，法律依据通常是合法利益或履行你请求访问页面所需的处理。',
            '赞助支付相关数据用于创建订单、完成支付跳转、验证支付通知和处理支付结果，法律依据通常是履行交易请求以及必要的合法利益。',
            '联系信息用于回复你的请求，法律依据通常是你的请求、同意或双方沟通所需的合法利益。'
          ]
        },
        {
          title: '第三方服务',
          body: [
            '本站部署可能使用 Cloudflare 等托管、网络、安全或边缘计算服务，它们可能代表本站处理访问日志和技术数据。',
            '赞助支付会跳转或提交到第三方支付服务。支付服务方会按照其自身规则处理支付账户、风控、清算和交易记录。',
            '本站目前没有在代码中集成第三方广告追踪或行为分析脚本。以后如果加入非必要统计、广告或再营销服务，会更新本政策并在需要时请求同意。'
          ]
        },
        {
          title: '保留期限',
          body: [
            '技术日志会按托管、安全和故障排查需要保留合理期限。',
            '支付相关记录会按交易核验、对账、税务、争议处理和合规要求保留必要期限。',
            '联系记录会保留到沟通目的完成，或在合理的后续跟进期限后删除，除非法律或安全原因要求继续保留。'
          ]
        },
        {
          title: '国际传输',
          body: [
            '本站、托管服务、支付服务或通信服务可能在你所在国家或地区以外处理数据。对于欧洲经济区以外的传输，本站依赖欧盟标准合同条款（SCCs）或相关服务方已获得的充分性认定等适当保障措施。'
          ]
        },
        {
          title: '你的权利',
          body: [
            '在适用法律允许的范围内，你可以请求访问、更正、删除、限制处理、数据可携带，或反对某些处理。基于同意的处理，你也可以撤回同意。',
            '如果你认为个人数据处理不符合法律要求，可以联系本站，也可以向所在地数据保护监管机构投诉。'
          ]
        },
        {
          title: '儿童隐私',
          body: [
            '本站面向一般读者，不主动面向儿童提供服务，也不有意收集儿童个人数据。'
          ]
        },
        {
          title: '政策更新',
          body: [
            '当网站功能、第三方服务或法律要求变化时，本政策可能更新。页面顶部的日期表示最近更新日期。'
          ]
        }
      ]
    },
    cookies: {
      title: 'Cookie 说明',
      description: '说明本站是否使用 Cookie、本地存储和类似技术。',
      updated: '2026-05-01',
      sections: [
        {
          title: '当前使用情况',
          body: [
            '根据当前代码，本站没有主动设置非必要 Cookie，也没有集成第三方广告追踪或行为分析脚本。',
            '站内搜索、语言切换和文章浏览功能不依赖浏览器持久化存储。'
          ]
        },
        {
          title: '必要技术数据',
          body: [
            '托管、安全、缓存或支付跳转过程中，服务器和第三方服务可能处理请求日志、IP 地址、User-Agent、时间戳和请求路径等必要技术数据。这类处理用于提供页面、安全防护、故障排查和支付流程。',
            '本站使用 Cloudflare 提供托管和安全服务。Cloudflare 可能设置必要的技术 Cookie，例如 __cf_bm（机器人检测，有效期约 30 分钟）和 cf_clearance（通过安全验证后的会话标识，有效期约 1 天）。这些 Cookie 是提供安全服务所必需的，不用于广告追踪。'
          ]
        },
        {
          title: '第三方支付',
          body: [
            '当你选择赞助并继续支付时，会离开本站或向第三方支付网关提交订单字段。支付服务方可能使用自己的 Cookie、风控标识或本地存储，具体以支付服务方政策为准。'
          ]
        },
        {
          title: '未来变更',
          body: [
            '如果本站未来加入非必要 Cookie、统计分析、广告、嵌入媒体或个性化功能，会更新本说明，并在适用法律要求时提供接受、拒绝或管理选择。'
          ]
        }
      ]
    },
    terms: {
      title: '使用条款',
      description: '说明访问本站、阅读内容、分享文章和使用赞助功能时适用的基本规则。',
      updated: '2026-05-01',
      sections: [
        {
          title: '内容用途',
          body: [
            '本站内容仅用于一般信息、研究记录和观点分享，不构成投资、交易、法律、税务、会计或其他专业建议。',
            '市场、策略、产业和宏观内容可能包含不完整信息、估计、个人判断或过时信息。你应独立核实并自行承担决策风险。'
          ]
        },
        {
          title: '知识产权',
          body: [
            '除非另有说明，本站文章、页面设计和原创素材归本站或相应权利人所有。',
            '你可以分享文章链接和合理引用少量内容，但不得在未获许可的情况下批量复制、镜像、出售、训练专有数据集或移除署名。'
          ]
        },
        {
          title: '赞助支付',
          body: [
            '赞助是自愿支持，不代表购买投资建议、咨询服务或保证未来内容输出。',
            '支付由第三方支付服务处理。提交支付前，请确认金额、支付方式和支付服务方规则。因支付账户、银行、钱包、网络或第三方服务导致的问题，应优先联系相应服务方。'
          ]
        },
        {
          title: '可用性和变更',
          body: [
            '本站可能因维护、托管故障、网络问题、内容调整或其他原因中断、变更或下线部分功能。',
            '本站可以更新文章、页面、功能和条款。继续访问本站表示你接受更新后的条款。'
          ]
        },
        {
          title: '责任限制',
          body: [
            '在适用法律允许的范围内，本站不对因使用或依赖本站内容产生的投资亏损、业务损失、数据损失、间接损害或第三方服务问题承担责任。'
          ]
        },
        {
          title: '联系方式',
          body: [
            '如需报告内容错误、权利问题、隐私请求或支付异常，可以通过页脚列出的联系方式联系本站。'
          ]
        }
      ]
    }
  },
  en: {
    privacy: {
      title: 'Privacy Policy',
      description: 'How this site handles data related to visits, search, sponsorship payments, and contact.',
      updated: '2026-05-01',
      sections: [
        {
          title: 'Controller',
          body: [
            'This site is operated by Rownix. For privacy requests, access, correction, or deletion, email connect@rownix.dev.'
          ]
        },
        {
          title: 'Data We Process',
          body: [
            'When you visit the site, hosting and security services may process IP address, device and browser information, access time, request path, and error logs to deliver pages, secure the service, troubleshoot issues, and prevent abuse.',
            'Site search lets you enter keywords in the browser and may request the site search endpoint to return article lists. The site does not currently intentionally store personal search history.',
            'When you use the sponsorship feature, the site creates an order number, amount, payment method, signature, notification URL, and return URL, then submits those necessary fields to a third-party payment service. Card details, wallet passwords, payment account credentials, and similar sensitive payment data are handled by the payment provider and are not collected by this page.',
            'If you contact the site by email, social account, or another channel, the site processes the contact details and message content you provide in order to respond.'
          ]
        },
        {
          title: 'Purposes and Legal Bases',
          body: [
            'Necessary access logs and security data are used to provide the site, maintain reliability, and prevent abuse. The legal basis is usually legitimate interests or processing needed to deliver the page you requested.',
            'Sponsorship payment data is used to create orders, redirect to checkout, verify payment notifications, and process payment results. The legal basis is usually performance of your transaction request and necessary legitimate interests.',
            'Contact information is used to respond to your request. The legal basis is usually your request, consent, or legitimate interests in communication.'
          ]
        },
        {
          title: 'Third-Party Services',
          body: [
            'The site deployment may use hosting, network, security, or edge computing services such as Cloudflare, which may process access logs and technical data on behalf of the site.',
            'Sponsorship payments redirect or submit data to a third-party payment service. The payment provider processes payment accounts, risk checks, settlement, and transaction records under its own rules.',
            'The current code does not include third-party advertising tracking or behavioral analytics scripts. If non-essential analytics, ads, or remarketing services are added later, this policy will be updated and consent will be requested where required.'
          ]
        },
        {
          title: 'Retention',
          body: [
            'Technical logs are retained for a reasonable period required for hosting, security, and troubleshooting.',
            'Payment-related records are retained as needed for transaction verification, reconciliation, tax, dispute handling, and compliance.',
            'Contact records are kept until the communication purpose is complete or after a reasonable follow-up period, unless legal or security reasons require longer retention.'
          ]
        },
        {
          title: 'International Transfers',
          body: [
            'The site, hosting services, payment services, or communication services may process data outside your country or region. For transfers outside the European Economic Area, the site relies on appropriate safeguards such as EU Standard Contractual Clauses (SCCs) or adequacy decisions applicable to the relevant service providers.'
          ]
        },
        {
          title: 'Your Rights',
          body: [
            'Where applicable law allows, you may request access, correction, deletion, restriction, portability, or object to certain processing. For processing based on consent, you may also withdraw consent.',
            'If you believe the handling of personal data does not meet legal requirements, you may contact the site or lodge a complaint with your local data protection authority.'
          ]
        },
        {
          title: 'Children',
          body: [
            'The site is intended for a general audience. It is not directed to children and does not knowingly collect children’s personal data.'
          ]
        },
        {
          title: 'Updates',
          body: [
            'This policy may be updated when site features, third-party services, or legal requirements change. The date at the top shows the latest update.'
          ]
        }
      ]
    },
    cookies: {
      title: 'Cookie Notice',
      description: 'Whether this site uses cookies, local storage, and similar technologies.',
      updated: '2026-05-01',
      sections: [
        {
          title: 'Current Use',
          body: [
            'Based on the current code, the site does not intentionally set non-essential cookies and does not include third-party advertising tracking or behavioral analytics scripts.',
            'Site search, language switching, and article browsing do not depend on persistent browser storage.'
          ]
        },
        {
          title: 'Necessary Technical Data',
          body: [
            'During hosting, security, caching, or payment redirects, servers and third-party services may process request logs, IP address, User-Agent, timestamps, and request paths. This processing is used to provide pages, protect the site, troubleshoot issues, and support the payment flow.',
            'The site uses Cloudflare for hosting and security. Cloudflare may set necessary technical cookies such as __cf_bm (bot detection, ~30-minute session) and cf_clearance (security challenge clearance, ~1-day session). These cookies are required to deliver the security service and are not used for advertising or tracking.'
          ]
        },
        {
          title: 'Third-Party Payments',
          body: [
            'When you choose to sponsor and continue to payment, you may leave this site or submit order fields to a third-party payment gateway. The payment provider may use its own cookies, risk identifiers, or local storage. Its own policy applies to that processing.'
          ]
        },
        {
          title: 'Future Changes',
          body: [
            'If the site later adds non-essential cookies, analytics, advertising, embedded media, or personalization features, this notice will be updated and accept, reject, or management choices will be provided where required by applicable law.'
          ]
        }
      ]
    },
    terms: {
      title: 'Terms of Use',
      description: 'Basic rules for visiting the site, reading content, sharing articles, and using sponsorship features.',
      updated: '2026-05-01',
      sections: [
        {
          title: 'Content Use',
          body: [
            'The site content is for general information, research notes, and opinion sharing only. It is not investment, trading, legal, tax, accounting, or other professional advice.',
            'Market, strategy, industry, and macro content may include incomplete information, estimates, personal judgment, or outdated information. You should verify independently and take responsibility for your own decisions.'
          ]
        },
        {
          title: 'Intellectual Property',
          body: [
            'Unless stated otherwise, articles, page design, and original materials belong to the site or their respective rights holders.',
            'You may share article links and make reasonable short quotations, but you may not bulk copy, mirror, sell, train proprietary datasets, or remove attribution without permission.'
          ]
        },
        {
          title: 'Sponsorship Payments',
          body: [
            'Sponsorship is voluntary support. It does not purchase investment advice, consulting services, or a guarantee of future content.',
            'Payments are handled by a third-party payment service. Before submitting payment, confirm the amount, payment method, and payment provider rules. Issues caused by payment accounts, banks, wallets, networks, or third-party services should be raised first with the relevant service provider.'
          ]
        },
        {
          title: 'Availability and Changes',
          body: [
            'The site may interrupt, change, or remove some functions due to maintenance, hosting failure, network issues, content changes, or other reasons.',
            'The site may update articles, pages, features, and these terms. Continuing to access the site means you accept the updated terms.'
          ]
        },
        {
          title: 'Limitation of Liability',
          body: [
            'To the extent allowed by applicable law, the site is not liable for investment losses, business losses, data loss, indirect damages, or third-party service issues caused by using or relying on site content.'
          ]
        },
        {
          title: 'Contact',
          body: [
            'To report content errors, rights issues, privacy requests, or payment issues, use the contact links listed in the footer.'
          ]
        }
      ]
    }
  }
} satisfies Record<Lang, Record<'privacy' | 'cookies' | 'terms', LegalPage>>;
