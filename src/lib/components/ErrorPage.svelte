<script lang="ts">
  import { page } from '$app/state';
  import { localizePath, t, type Lang } from '$lib/i18n';
  import type { ArticleSummary } from '$lib/content';

  let {
    lang,
    copy,
    latestArticles
  }: {
    lang: Lang;
    copy: ReturnType<typeof t>;
    latestArticles: ArticleSummary[];
  } = $props();

  const errorCopy = $derived(copy.errorPage as {
    eyebrow: string;
    title: string;
    copy: string;
    home: string;
    articles: string;
    latest: string;
    detail: string;
  });
  const status = $derived(page.status || 404);
  const suggestions = $derived(latestArticles.slice(0, 3));
</script>

<svelte:head>
  <title>{status} | {copy.siteTitle}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="error-page">
  <section class="error-hero" aria-labelledby="error-title">
    <div class="error-code" aria-hidden="true">
      <span>{status}</span>
    </div>

    <div class="error-copy">
      <p class="eyebrow">{errorCopy.eyebrow}</p>
      <h1 id="error-title">{errorCopy.title}</h1>
      <p>{errorCopy.copy}</p>

      <div class="error-actions">
        <a class="primary-link error-primary" href={localizePath(lang)}>
          {errorCopy.home}
        </a>
        <a href={localizePath(lang, '/#articles')}>{errorCopy.articles}</a>
      </div>
    </div>
  </section>

  {#if suggestions.length}
    <section class="error-suggestions" aria-labelledby="error-suggestions-title">
      <div>
        <p class="eyebrow">{errorCopy.latest}</p>
        <h2 id="error-suggestions-title">{copy.latest}</h2>
      </div>

      <div class="error-suggestion-list">
        {#each suggestions as article}
          <a href={localizePath(lang, `/articles/${article.slug}`)}>
            <span>{article.topic} · {article.minutes} {copy.minutes}</span>
            <strong>{article.title}</strong>
            <p>{article.description}</p>
          </a>
        {/each}
      </div>
    </section>
  {/if}
</main>
