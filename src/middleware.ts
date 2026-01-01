import './polyfills'
import { defineMiddleware } from 'astro:middleware'
import { getBrowserLanguage, createLanguageCookie } from './lib/language-detector'

export const onRequest = defineMiddleware((context, next) => {
  const { request, url } = context

  // 只处理根路径的重定向
  if (url.pathname === '/' || url.pathname === '') {
    // 检查是否在预渲染/构建阶段
    // 在构建阶段，我们会跳过中间件处理，让静态 index.html 处理重定向
    const acceptLang = request.headers.get('accept-language')
    const cookie = request.headers.get('cookie')

    if (!acceptLang && !cookie) {
      return next()
    }

    try {
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
    } catch (e) {
      return next()
    }
  }

  // 继续处理其他请求
  return next()
})