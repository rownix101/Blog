<script lang="ts">
  import { page } from '$app/state';
  import { localizePath } from '$lib/i18n';

  let { data } = $props();

  const errorCopy = $derived(data.copy.errorPage as {
    eyebrow: string;
    title: string;
    copy: string;
    home: string;
    articles: string;
    latest: string;
    detail: string;
  });
  const status = $derived(page.status || 404);
  const latestArticles = $derived(data.latestArticles.slice(0, 3));
</script>

<svelte:head>
  <title>{status} | {data.copy.siteTitle}</title>
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
        <a class="primary-link error-primary" href={localizePath(data.lang)}>
          {errorCopy.home}
        </a>
        <a href={localizePath(data.lang, '/#articles')}>{errorCopy.articles}</a>
      </div>
    </div>
  </section>

  {#if latestArticles.length}
    <section class="error-suggestions" aria-labelledby="error-suggestions-title">
      <div>
        <p class="eyebrow">{errorCopy.latest}</p>
        <h2 id="error-suggestions-title">{data.copy.latest}</h2>
      </div>

      <div class="error-suggestion-list">
        {#each latestArticles as article}
          <a href={localizePath(data.lang, `/articles/${article.slug}`)}>
            <span>{article.topic} · {article.minutes} {data.copy.minutes}</span>
            <strong>{article.title}</strong>
            <p>{article.description}</p>
          </a>
        {/each}
      </div>
    </section>
  {/if}
</main>
