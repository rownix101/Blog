// Import polyfills for Cloudflare Workers
import '../src/polyfills.ts'

export function onRequest(context) {
  const { request, url } = context
  const pathname = url.pathname

  // 只处理根路径
  if (pathname === '/') {
    const supportedLangs = ['zh-cn', 'en']
    const defaultLang = 'zh-cn'
    let targetLang = defaultLang

    try {
      // 1. 检查 cookie
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const cookieMatch = cookieHeader.match(/language=([^;]+)/)
        if (cookieMatch && supportedLangs.includes(cookieMatch[1])) {
          targetLang = cookieMatch[1]
        }
      }

      // 2. 如果没有有效的 cookie，检查 Accept-Language 头
      if (targetLang === defaultLang) {
        const acceptLanguage = request.headers.get('accept-language')
        if (acceptLanguage) {
          // 解析 Accept-Language 头
          const languages = acceptLanguage
            .split(',')
            .map(lang => {
              const [code, quality = '1'] = lang.trim().split(';q=')
              return {
                code: code.toLowerCase(),
                quality: parseFloat(quality)
              }
            })
            .sort((a, b) => b.quality - a.quality)

          // 查找最佳匹配语言
          for (const { code } of languages) {
            if (code.startsWith('en')) {
              targetLang = 'en'
              break
            } else if (code.startsWith('zh') || code.startsWith('zh-cn')) {
              targetLang = 'zh-cn'
              break
            }
          }
        }
      }
    } catch (e) {
      console.error('Language detection failed', e)
    }

    // 执行 302 重定向
    const redirectUrl = `https://${url.host}/${targetLang}/`
    return Response.redirect(redirectUrl, 302)
  }

  // 对于其他路径，继续正常的页面处理
  return context.next()
}