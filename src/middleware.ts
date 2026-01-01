import { defineMiddleware } from 'astro:middleware'
import { getBrowserLanguage, createLanguageCookie } from './lib/language-detector'

export const onRequest = defineMiddleware((context, next) => {
  const { request, url } = context

  // 只处理根路径的重定向
  if (url.pathname === '/' || url.pathname === '') {
    const targetLang = getBrowserLanguage(request)
    const redirectUrl = new URL(`/${targetLang}/`, url)

    // 创建重定向响应
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString(),
        'Set-Cookie': createLanguageCookie(targetLang)
      }
    })
  }

  // 继续处理其他请求
  return next()
})