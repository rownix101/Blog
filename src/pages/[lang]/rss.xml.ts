import { SITE } from '@/consts'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getAllPosts } from '@/lib/data-utils'
import { languages } from '@/i18n/ui'

export async function getStaticPaths() {
    return Object.keys(languages).map((lang) => ({ params: { lang } }))
}

export async function GET(context: APIContext) {
    const { lang } = context.params
    try {
        const posts = await getAllPosts(lang)

        return rss({
            title: `${SITE.title} (${lang})`,
            description: SITE.description,
            site: context.site ?? SITE.href,
            items: posts.map((post) => {
                const idWithoutLang = post.id.split('/').slice(1).join('/')
                return {
                    title: post.data.title,
                    description: post.data.description,
                    pubDate: post.data.date,
                    link: `/${lang}/blog/${idWithoutLang}/`,
                }
            }),
        })
    } catch (error) {
        console.error('Error generating RSS feed:', error)
        return new Response('Error generating RSS feed', { status: 500 })
    }
}
