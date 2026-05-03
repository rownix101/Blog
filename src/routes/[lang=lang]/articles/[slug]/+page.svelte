<script lang="ts">
  import { localizePath } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let { data } = $props();

  let copied = $state(false);
  let tocOpen = $state(true);
  let activeHeadingId = $state('');
  let readingProgress = $state(0);
  let showBackToTop = $state(false);
  let footerVisible = $state(false);

  const encodedUrl = $derived(encodeURIComponent(data.shareUrl));
  const encodedTitle = $derived(encodeURIComponent(data.article.title));
  const encodedDescription = $derived(encodeURIComponent(data.article.description));
  const shareCopy = $derived(data.copy.share as {
    title: string;
    native: string;
    copy: string;
    copied: string;
    email: string;
  });
  const tocCopy = $derived(data.copy.toc as {
    title: string;
    show: string;
    hide: string;
  });
  const tableOfContents = $derived(
    data.article.toc.map((item: { id: string; label: string; depth: number }) => ({
      id: item.id,
      label: item.label
    }))
  );
  const shareTargets = $derived([
    {
      label: 'X',
      icon: 'x',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    },
    {
      label: 'Reddit',
      icon: 'reddit',
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`
    },
    {
      label: 'WhatsApp',
      icon: 'whatsapp',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
    },
    {
      label: 'Telegram',
      icon: 'telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
    },
    {
      label: 'Facebook',
      icon: 'facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      label: 'LinkedIn',
      icon: 'linkedin',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    }
  ]);

  const shareArticle = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    await navigator.share({
      title: data.article.title,
      text: data.article.description,
      url: data.shareUrl
    });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(data.shareUrl);
    copied = true;
    window.setTimeout(() => {
      copied = false;
    }, 1800);
  };
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  onMount(() => {
    let scrollableHeight = 0;
    let animationFrame = 0;
    let measureFrame = 0;

    const updateFromScrollPosition = () => {
      animationFrame = 0;
      const nextProgress =
        scrollableHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollableHeight) * 100)) : 0;
      const nextShowBackToTop = window.scrollY > 300;

      if (readingProgress !== nextProgress) readingProgress = nextProgress;
      if (showBackToTop !== nextShowBackToTop) showBackToTop = nextShowBackToTop;
    };

    const scheduleScrollUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateFromScrollPosition);
    };

    const measureScrollableHeight = () => {
      measureFrame = 0;
      scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      scheduleScrollUpdate();
    };

    const scheduleMeasure = () => {
      if (measureFrame) return;
      measureFrame = window.requestAnimationFrame(measureScrollableHeight);
    };

    const headings = tableOfContents
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => Boolean(heading));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible?.target.id) {
          activeHeadingId = visible.target.id;
        }
      },
      {
        rootMargin: '-18% 0px -70% 0px',
        threshold: [0, 1]
      }
    );

    headings.forEach((heading) => observer.observe(heading));
    activeHeadingId = headings[0]?.id ?? '';

    const footerObserver = new IntersectionObserver((entries) => {
      footerVisible = entries[0].isIntersecting;
    });
    const footerTarget = document.querySelector('.site-footer');
    if (footerTarget) footerObserver.observe(footerTarget);

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(document.body);

    scheduleMeasure();
    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      observer.disconnect();
      footerObserver.disconnect();
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(measureFrame);
      window.removeEventListener('scroll', scheduleScrollUpdate);
      window.removeEventListener('resize', scheduleMeasure);
    };
  });
</script>

<svelte:head>
  <title>{data.article.title} | {data.copy.siteTitle}</title>
  <meta name="description" content={data.article.description} />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href={data.canonicalUrl} />
  {#if data.preloadImage}
    <link rel="preload" as="image" href={data.preloadImage} fetchpriority="high" />
  {/if}
  {#each Object.entries(data.alternateUrls) as [lang, href]}
    <link rel="alternate" hreflang={lang} href={href} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={data.alternateUrls.zh ?? data.canonicalUrl} />
  <meta property="og:title" content={data.article.title} />
  <meta property="og:description" content={data.article.description} />
  <meta property="og:url" content={data.shareUrl} />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content={data.lang === 'zh' ? 'zh_CN' : 'en_US'} />
  <meta property="article:published_time" content={data.article.date} />
  <meta property="article:modified_time" content={data.article.updated ?? data.article.date} />
  <meta property="article:section" content={data.article.topic} />
  <meta property="article:author" content="Rownix" />
  {#if data.article.coverImage}
    <meta property="og:image" content={data.imageUrl} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="675" />
    <meta property="og:image:alt" content={data.article.coverAlt ?? data.article.title} />
  {/if}
  <meta name="twitter:card" content={data.article.coverImage ? 'summary_large_image' : 'summary'} />
  <meta name="twitter:title" content={data.article.title} />
  <meta name="twitter:description" content={data.article.description} />
  {#if data.imageUrl}
    <meta name="twitter:image" content={data.imageUrl} />
    <meta name="twitter:image:alt" content={data.article.coverAlt ?? data.article.title} />
  {/if}
  {@html `<script type="application/ld+json">${data.jsonLd}</script>`}
</svelte:head>

<div class="reading-progress" aria-hidden="true">
  <span style={`width: ${readingProgress}%`}></span>
</div>

<main class="article-page">
  <article class="prose">
    <a class="back-link" href={localizePath(data.lang)}>← {data.copy.nav.home}</a>
    <header>
      <p class="eyebrow">{data.article.topic}</p>
      <h1>{data.article.title}</h1>
      <p>{data.article.description}</p>
      <div class="article-meta">
        <time datetime={data.article.date}>
          {new Intl.DateTimeFormat(data.lang === 'zh' ? 'zh-CN' : 'en-US', {
            dateStyle: 'long'
          }).format(new Date(data.article.date))}
        </time>
        {#if data.article.updated && data.article.updated !== data.article.date}
          <span>
            {data.copy.articleMeta.updated}
            <time datetime={data.article.updated}>
              {new Intl.DateTimeFormat(data.lang === 'zh' ? 'zh-CN' : 'en-US', {
                dateStyle: 'long'
              }).format(new Date(data.article.updated))}
            </time>
          </span>
        {/if}
        <span>{data.article.minutes} {data.copy.minutes}</span>
      </div>
      {#if data.article.coverImage}
        <picture>
          {#if data.article.coverImageAvif}
            <source srcset={data.article.coverImageAvif} type="image/avif" />
          {/if}
          <img
            class="article-cover"
            src={data.article.coverImage}
            alt={data.article.coverAlt ?? ''}
            width="1200"
            height="675"
            loading="eager"
            decoding="async"
            fetchpriority="high"
          />
        </picture>
      {/if}
    </header>

    {@html data.article.html}

    <section class="share-panel" aria-labelledby="share-title">
      <h2 id="share-title">{shareCopy.title}</h2>
      <div class="share-actions">
        <button type="button" onclick={shareArticle} aria-label={shareCopy.native} title={shareCopy.native}>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
            <path d="M12 3v12" />
            <path d="m7 8 5-5 5 5" />
          </svg>
        </button>
        {#each shareTargets as target}
          <a href={target.href} target="_blank" rel="noreferrer" aria-label={target.label} title={target.label}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              {#if target.icon === 'x'}
                <path d="m4 4 16 16" />
                <path d="M20 4 4 20" />
              {:else if target.icon === 'reddit'}
                <circle cx="12" cy="14" r="6" />
                <circle cx="9.5" cy="13" r=".75" />
                <circle cx="14.5" cy="13" r=".75" />
                <path d="M9.5 16c1.5 1 3.5 1 5 0" />
                <path d="M12 8.2 13.4 4l4 .8" />
                <circle cx="18.4" cy="5" r="1.4" />
                <path d="M6.8 11.5 4 10" />
                <path d="m17.2 11.5 2.8-1.5" />
              {:else if target.icon === 'whatsapp'}
                <path d="M4.5 20 6 16.7A8 8 0 1 1 9.3 20z" />
                <path d="M9 9.5c.4 2.4 2.1 4.1 5.5 5.5l1.5-1.5-2.1-1-1 1c-1.2-.6-2.1-1.5-2.7-2.7l1-1L10 7.5z" />
              {:else if target.icon === 'telegram'}
                <path d="m21 4-4 16-6-5-4 3 1.5-5L3 10z" />
                <path d="m8.5 13 8-5.5" />
              {:else if target.icon === 'facebook'}
                <path d="M14 8h3V4h-3c-2.2 0-4 1.8-4 4v3H7v4h3v5h4v-5h3l1-4h-4z" />
              {:else if target.icon === 'linkedin'}
                <path d="M6.5 10v9" />
                <path d="M6.5 6v.1" />
                <path d="M11 19v-9" />
                <path d="M11 14c0-2.4 1.2-4 3.4-4 2 0 3.1 1.4 3.1 3.7V19" />
              {/if}
            </svg>
          </a>
        {/each}
        <a
          href={`mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`}
          aria-label={shareCopy.email}
          title={shareCopy.email}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 6h16v12H4z" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </a>
        <button
          type="button"
          onclick={copyLink}
          aria-label={copied ? shareCopy.copied : shareCopy.copy}
          title={copied ? shareCopy.copied : shareCopy.copy}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            {#if copied}
              <path d="m5 12 4 4L19 6" />
            {:else}
              <path d="M9 9h10v10H9z" />
              <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
            {/if}
          </svg>
        </button>
      </div>
    </section>
  </article>

  <aside class="article-side" aria-label={tocCopy.title}>
    {#if tableOfContents.length}
      <section class="toc-panel">
        <button
          type="button"
          class="toc-toggle"
          aria-expanded={tocOpen}
          aria-controls="article-toc"
          onclick={() => (tocOpen = !tocOpen)}
        >
          <span>{tocCopy.title}</span>
          <span aria-hidden="true">{tocOpen ? '−' : '+'}</span>
        </button>
        {#if tocOpen}
          <nav id="article-toc" class="toc-list" aria-label={tocCopy.title}>
            {#each tableOfContents as item}
              <a class:active-toc={activeHeadingId === item.id} aria-current={activeHeadingId === item.id ? 'true' : undefined} href={`#${item.id}`}>{item.label}</a>
            {/each}
          </nav>
        {/if}
      </section>
    {/if}

    <section class="related" aria-label="Related articles">
      {#each data.related as article}
        <a href={localizePath(data.lang, `/articles/${article.slug}`)}>
          <span>{article.topic}</span>
          <strong>{article.title}</strong>
        </a>
      {/each}
    </section>
  </aside>
</main>

{#if showBackToTop}
  <button type="button" transition:fade={{ duration: 150 }} class="back-to-top" class:hidden-on-mobile={footerVisible} onclick={scrollToTop} aria-label={data.copy.backToTop as string} title={data.copy.backToTop as string}>
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6 15 6-6 6 6" />
    </svg>
  </button>
{/if}
