<script lang="ts">
  import { socialLinks } from '$lib/profile';

  let { data } = $props();

  const aboutSections = $derived(
    data.copy.aboutSections as Array<{
      title: string;
      body: string;
    }>
  );
</script>

<svelte:head>
  <title>{data.copy.aboutTitle as string} · {data.copy.siteTitle as string}</title>
  <meta name="description" content={data.copy.aboutDescription as string} />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href={data.canonicalUrl} />
  {#each Object.entries(data.alternateUrls) as [lang, href]}
    <link rel="alternate" hreflang={lang} href={href} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={data.alternateUrls.zh} />
  <meta property="og:title" content={`${data.copy.aboutTitle as string} · ${data.copy.siteTitle as string}`} />
  <meta property="og:description" content={data.copy.aboutDescription as string} />
  <meta property="og:url" content={data.canonicalUrl} />
  <meta property="og:type" content="profile" />
  <meta property="og:locale" content={data.lang === 'zh' ? 'zh_CN' : 'en_US'} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={`${data.copy.aboutTitle as string} · ${data.copy.siteTitle as string}`} />
  <meta name="twitter:description" content={data.copy.aboutDescription as string} />
  {@html `<script type="application/ld+json">${data.jsonLd}</script>`}
</svelte:head>

<main class="about-page">
  <header class="about-hero">
    <p class="eyebrow">{data.copy.siteTitle}</p>
    <h1>{data.copy.aboutTitle}</h1>
    <p>{data.copy.aboutDescription}</p>
  </header>

  <div class="about-content">
    <div class="about-sections">
      {#each aboutSections as section}
        <section>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      {/each}
    </div>

    <aside class="about-contact" aria-label={data.copy.socialTitle as string}>
      <p class="eyebrow">{data.copy.socialTitle}</p>
      <div class="social-list">
        {#each socialLinks as link}
          <a
            href={link.href}
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
          >
            <span>{link.label}</span>
            <strong>{link.value}</strong>
          </a>
        {/each}
      </div>
    </aside>
  </div>
</main>
