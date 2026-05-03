<script lang="ts">
  import { localizePath } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let { data } = $props();

  const articlesPerPage = 6;
  let selectedTopic = $state('');
  let currentPage = $state(1);
  let showBackToTop = $state(false);
  let footerVisible = $state(false);

  onMount(() => {
    let animationFrame = 0;

    const updateScrollState = () => {
      animationFrame = 0;
      showBackToTop = window.scrollY > 300;
    };
    const scheduleScrollUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateScrollState);
    };

    const observer = new IntersectionObserver((entries) => {
      footerVisible = entries[0].isIntersecting;
    });
    const target = document.querySelector('.bottom-grid') || document.querySelector('.site-footer');
    if (target) observer.observe(target);

    updateScrollState();
    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', scheduleScrollUpdate);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', scheduleScrollUpdate);
      window.removeEventListener('resize', scheduleScrollUpdate);
    };
  });

  const searchCopy = $derived(data.copy.search as {
    label: string;
    placeholder: string;
    noResults: string;
    clear: string;
    showing: string;
    total: string;
    viewAll: string;
    topic: string;
  });
  const paginationCopy = $derived(data.copy.pagination as {
    label: string;
    previous: string;
    next: string;
    page: string;
    status: string;
  });
  const filteredArticles = $derived(
    data.articles.filter((article) => {
      const matchesTopic = selectedTopic ? article.topic === selectedTopic : true;

      return matchesTopic;
    })
  );
  const totalPages = $derived(Math.max(1, Math.ceil(filteredArticles.length / articlesPerPage)));
  const paginatedArticles = $derived(
    filteredArticles.slice((currentPage - 1) * articlesPerPage, currentPage * articlesPerPage)
  );
  const paginationPages = $derived(
    Array.from({ length: totalPages }, (_, index) => index + 1)
  );
  const resetFilters = () => {
    selectedTopic = '';
    currentPage = 1;
  };
  const goToPage = (page: number) => {
    currentPage = Math.min(totalPages, Math.max(1, page));
    document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const pageLabel = (page: number) => paginationCopy.page.replace('{page}', String(page));
  const paginationStatus = $derived(
    paginationCopy.status
      .replace('{current}', String(currentPage))
      .replace('{total}', String(totalPages))
  );
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
</script>

<svelte:head>
  <title>{data.copy.siteTitle as string}</title>
  <meta name="description" content={data.copy.siteDescription as string} />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href={data.canonicalUrl} />
  {#if data.featured?.coverImage}
    <link
      rel="preload"
      as="image"
      href={data.featured.coverImageAvif ?? data.featured.coverImage}
      fetchpriority="high"
    />
  {/if}
  {#each Object.entries(data.alternateUrls) as [lang, href]}
    <link rel="alternate" hreflang={lang} href={href} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={data.alternateUrls.zh} />
  <meta property="og:title" content={data.copy.siteTitle as string} />
  <meta property="og:description" content={data.copy.siteDescription as string} />
  <meta property="og:url" content={data.canonicalUrl} />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content={data.lang === 'zh' ? 'zh_CN' : 'en_US'} />
  {#if data.featuredImageUrl}
    <meta property="og:image" content={data.featuredImageUrl} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="675" />
  {/if}
  <meta name="twitter:card" content={data.featuredImageUrl ? 'summary_large_image' : 'summary'} />
  <meta name="twitter:title" content={data.copy.siteTitle as string} />
  <meta name="twitter:description" content={data.copy.siteDescription as string} />
  {#if data.featuredImageUrl}
    <meta name="twitter:image" content={data.featuredImageUrl} />
  {/if}
  {@html `<script type="application/ld+json">${data.jsonLd}</script>`}
</svelte:head>

<main>
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">{data.copy.heroLabel}</p>
      <h1>{data.copy.heroTitle}</h1>
      <p class="lede">{data.copy.heroCopy}</p>
      <a class="primary-link" href="#articles">{data.copy.latest}</a>
    </div>

    {#if data.featured}
      <aside class="feature-panel" aria-label={data.copy.featured as string}>
        {#if data.featured.coverImage}
          <picture>
            {#if data.featured.coverImageAvif}
              <source srcset={data.featured.coverImageAvif} type="image/avif" />
            {/if}
            <img
              class="card-cover"
              src={data.featured.coverImage}
              alt={data.featured.coverAlt ?? ''}
              width="1200"
              height="675"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
          </picture>
        {/if}
        <div>
          <span>{data.copy.featured}</span>
          <time datetime={data.featured.date}>
            {new Intl.DateTimeFormat(data.lang === 'zh' ? 'zh-CN' : 'en-US', {
              dateStyle: 'medium'
            }).format(new Date(data.featured.date))}
          </time>
          <span>{data.featured.topic}</span>
        </div>
        <h2>
          <a href={localizePath(data.lang, `/articles/${data.featured.slug}`)}>
            {data.featured.title}
          </a>
        </h2>
        <p>{data.featured.description}</p>
        <footer>
          <span>{data.featured.minutes} {data.copy.minutes}</span>
          <a href={localizePath(data.lang, `/articles/${data.featured.slug}`)}>
            {data.copy.readArticle}
          </a>
        </footer>
      </aside>
    {/if}
  </section>

  <section class="content-grid" id="articles" aria-labelledby="latest-heading">
    <div>
      <p class="eyebrow">
        {filteredArticles.length} / {data.articles.length} posts
      </p>
      <h2 id="latest-heading">{data.copy.latest}</h2>
      <p class="filter-status" aria-live="polite">
        {#if selectedTopic}
          {searchCopy.topic} "{selectedTopic}", {searchCopy.total} {filteredArticles.length} {data.copy.search.results}
        {:else}
          {data.articles.length} posts
        {/if}
      </p>
    </div>

    <div class="article-list">
      {#each paginatedArticles as article}
        <article class="article-card">
          {#if article.coverImage}
            <picture>
              {#if article.coverImageAvif}
                <source srcset={article.coverImageAvif} type="image/avif" />
              {/if}
              <img
                class="card-cover"
                src={article.coverImage}
                alt={article.coverAlt ?? ''}
                width="1200"
                height="675"
                loading="lazy"
                decoding="async"
              />
            </picture>
          {/if}
          <div>
            <time datetime={article.date}>
              {new Intl.DateTimeFormat(data.lang === 'zh' ? 'zh-CN' : 'en-US', {
                dateStyle: 'medium'
              }).format(new Date(article.date))}
            </time>
            <span>{article.topic}</span>
          </div>
          <h3>
            <a href={localizePath(data.lang, `/articles/${article.slug}`)}>{article.title}</a>
          </h3>
          <p>{article.description}</p>
          <footer>
            <span>{article.minutes} {data.copy.minutes}</span>
            <a href={localizePath(data.lang, `/articles/${article.slug}`)}>{data.copy.readArticle}</a>
          </footer>
        </article>
      {:else}
        <div class="empty-state">
          <p>{searchCopy.noResults}</p>
          <button type="button" onclick={resetFilters}>{searchCopy.viewAll}</button>
        </div>
      {/each}

      {#if filteredArticles.length && totalPages > 1}
        <nav class="pagination" aria-label={paginationCopy.label}>
          <button
            type="button"
            onclick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label={paginationCopy.previous}
            title={paginationCopy.previous}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div>
            {#each paginationPages as page}
              <button
                type="button"
                class:active-page={currentPage === page}
                aria-current={currentPage === page ? 'page' : undefined}
                aria-label={pageLabel(page)}
                onclick={() => goToPage(page)}
              >
                {page}
              </button>
            {/each}
          </div>
          <button
            type="button"
            onclick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label={paginationCopy.next}
            title={paginationCopy.next}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <span>{paginationStatus}</span>
        </nav>
      {/if}
    </div>
  </section>

  <section class="bottom-grid">
    <div id="topics" class="plain-section">
      <p class="eyebrow">{data.copy.allTopics}</p>
      <div class="topic-list">
        {#each data.topics as topic}
          <button
            type="button"
            class:active-topic={selectedTopic === topic}
            onclick={() => {
              selectedTopic = selectedTopic === topic ? '' : topic;
              currentPage = 1;
              location.hash = 'articles';
            }}
          >
            {topic}
          </button>
        {/each}
      </div>
    </div>
  </section>
</main>

{#if showBackToTop}
  <button type="button" transition:fade={{ duration: 150 }} class="back-to-top" class:hidden-on-mobile={footerVisible} onclick={scrollToTop} aria-label={data.copy.backToTop as string} title={data.copy.backToTop as string}>
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6 15 6-6 6 6" />
    </svg>
  </button>
{/if}
