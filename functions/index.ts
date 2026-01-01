interface Env {
    // Define environment variables if needed
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const request = context.request;
    const url = new URL(request.url);

    // Supported languages
    const supportedLanguages = ['zh-cn', 'en'];
    const defaultLanguage = 'zh-cn';

    // 1. Check Cookie
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, string>);

        const cookieLang = cookies['language'];
        if (cookieLang && supportedLanguages.includes(cookieLang)) {
            return Response.redirect(`${url.origin}/${cookieLang}/`, 302);
        }
    }

    // 2. Check Accept-Language
    const acceptLanguage = request.headers.get('Accept-Language');
    let targetLang = defaultLanguage;

    if (acceptLanguage) {
        // Basic parsing of Accept-Language header
        // Ideally we would use a library, but for a simple function we can implement basic logic
        const languages = acceptLanguage.split(',')
            .map(lang => {
                const [tag, weight] = lang.split(';q=');
                return {
                    tag: tag.trim().toLowerCase(),
                    weight: weight ? parseFloat(weight) : 1.0
                };
            })
            .sort((a, b) => b.weight - a.weight);

        for (const { tag } of languages) {
            // Exact match
            if (supportedLanguages.includes(tag)) {
                targetLang = tag;
                break;
            }

            // Prefix match (e.g. en-US -> en)
            const prefix = tag.split('-')[0];
            if (supportedLanguages.includes(prefix)) {
                targetLang = prefix;
                break;
            }

            // Special case for zh
            if (prefix === 'zh') {
                targetLang = 'zh-cn';
                break;
            }
        }
    }

    // 3. Redirect
    // Add Set-Cookie header to persist preference if it came from detection
    const response = Response.redirect(`${url.origin}/${targetLang}/`, 302);

    // Optional: Set cookie if it wasn't present, to avoid re-detection next time
    // Note: Response.redirect creates an immutable response in some environments, 
    // checking if we need to construct a new Response to set headers.
    // In Cloudflare Workers/Pages, Response.redirect returns a Response object that might be immutable headers.
    // However, standard practice often uses the redirect response directly. 
    // If we want to set a cookie, we might need to create a new Response with the Location header.

    const headers = new Headers(response.headers);
    headers.set('Set-Cookie', `language=${targetLang}; Path=/; Max-Age=31536000; SameSite=Lax`);

    return new Response(null, {
        status: 302,
        headers: headers
    });
};
