import { defaultLang, languages } from '../i18n/ui'

export function getBrowserLanguage(request: Request): string {
  // 1. 检查 cookie 中的语言偏好（最高优先级）
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    if (cookies['language'] && cookies['language'] in languages) {
      return cookies['language']
    }
  }

  // 2. 检查 Accept-Language 头
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    // 解析 Accept-Language 头，按权重排序
    const preferredLanguages = acceptLanguage
      .split(',')
      .map(lang => {
        const [locale, quality = '1'] = lang.trim().split(';q=')
        return {
          locale: locale.toLowerCase(),
          quality: parseFloat(quality)
        }
      })
      .sort((a, b) => b.quality - a.quality)

    // 尝试匹配支持的语言
    for (const { locale } of preferredLanguages) {
      // 直接匹配
      if (locale in languages) {
        return locale
      }

      // 匹配语言前缀（如 en-US 匹配 en）
      const langPrefix = locale.split('-')[0]
      if (langPrefix in languages) {
        return langPrefix
      }

      // 特殊处理：zh 匹配 zh-cn
      if (langPrefix === 'zh' && 'zh-cn' in languages) {
        return 'zh-cn'
      }
    }
  }

  // 3. 返回默认语言
  return defaultLang
}

export function createLanguageCookie(locale: string): string {
  return `language=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export function shouldRedirect(request: Request): { should: boolean; to: string } | null {
  const url = new URL(request.url)
  const pathname = url.pathname

  // 如果已经有语言前缀，不需要重定向
  const pathSegments = pathname.split('/').filter(Boolean)
  if (pathSegments.length > 0 && pathSegments[0] in languages) {
    return null
  }

  // 获取目标语言
  const targetLang = getBrowserLanguage(request)

  // 如果目标语言就是默认语言且当前路径是根路径，可能需要添加前缀
  const newPath = `/${targetLang}${pathname.startsWith('/') ? pathname : '/' + pathname}`

  return {
    should: true,
    to: newPath
  }
}