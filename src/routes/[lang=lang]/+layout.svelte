<script lang="ts">
  import { languageOptions, languages, localizePath, type Lang } from '$lib/i18n';
  import { socialLinks } from '$lib/profile';
  import { page } from '$app/state';
  import { tick } from 'svelte';
  import './app.css';

  let { data, children } = $props();
  let searchOpen = $state(false);
  let searchQuery = $state('');
  let searchInput = $state<HTMLInputElement | null>(null);

  const navItems = [
    { key: 'home', href: '' },
    { key: 'articles', href: '#articles' },
    { key: 'topics', href: '#topics' },
    { key: 'about', href: '#about' },
    { key: 'sponsor', href: '/sponsor' }
  ] as const;

  const currentPath = (lang: Lang) => {
    const path = page.url.pathname;
    const languagePrefixPattern = new RegExp(`^/(${languages.join('|')})(?=/|$)`);
    const withoutLang = path.replace(languagePrefixPattern, '') || '/';
    return `${localizePath(lang, withoutLang)}${page.url.search}${page.url.hash}`;
  };

  const searchCopy = $derived(data.copy.search as {
    label: string;
    open: string;
    close: string;
    placeholder: string;
    results: string;
    noResults: string;
    clear: string;
    showing: string;
    total: string;
    viewAll: string;
  });
  const normalizedSearchQuery = $derived(searchQuery.trim().toLocaleLowerCase());
  const searchResults = $derived(
    normalizedSearchQuery
      ? data.searchArticles.filter((article) =>
          [article.title, article.description, article.topic]
            .join(' ')
            .toLocaleLowerCase()
            .includes(normalizedSearchQuery)
        )
      : data.searchArticles.slice(0, 6)
  );

  const closeSearch = () => {
    searchOpen = false;
    searchQuery = '';
  };

  const openSearch = async () => {
    searchOpen = true;
    await tick();
    searchInput?.focus();
  };
</script>

<svelte:head>
  <title>{data.copy.siteTitle as string}</title>
  <meta name="description" content={data.copy.siteDescription as string} />
  <link rel="icon" href="/favicon.svg" />
</svelte:head>

<div class="shell">
  <header class="site-header">
    <a class="brand" href={localizePath(data.lang)}>
      <span class="brand-mark" aria-hidden="true"></span>
      <span>{data.copy.siteTitle}</span>
    </a>

    <nav class="main-nav" aria-label="Primary navigation">
      {#each navItems as item}
        <a
          href={item.href.startsWith('/')
            ? localizePath(data.lang, item.href)
            : item.href
              ? `${localizePath(data.lang)}${item.href}`
              : localizePath(data.lang)}
        >
          {data.copy.nav[item.key]}
        </a>
      {/each}
    </nav>

    <button
      type="button"
      class="header-search"
      aria-expanded={searchOpen}
      aria-controls="site-search"
      onclick={openSearch}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 4 4" />
      </svg>
      <span>{searchCopy.open}</span>
    </button>

    <details class="language-switcher">
      <summary aria-label={data.copy.switchLanguage as string}>
        <span>{languageOptions.find((option) => option.code === data.lang)?.name}</span>
      </summary>
      <ul aria-label={data.copy.switchLanguage as string}>
        {#each languageOptions as option}
          <li>
            {#if option.available}
              <a class:active-lang={option.code === data.lang} href={currentPath(option.code)}>
                <span>{option.name}</span>
              </a>
            {:else}
              <span class="planned-lang" aria-disabled="true">
                <span>{option.name}</span>
                <span>{data.copy.languageSoon}</span>
              </span>
            {/if}
          </li>
        {/each}
      </ul>
    </details>
  </header>

  {#if searchOpen}
    <div class="search-backdrop" role="presentation" onclick={closeSearch}></div>
    <div
      id="site-search"
      class="search-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-search-title"
    >
      <div class="search-panel-header">
        <div>
          <p class="eyebrow">{searchCopy.label}</p>
          <h2 id="site-search-title">{searchCopy.open}</h2>
        </div>
        <button type="button" class="icon-button" aria-label={searchCopy.close} onclick={closeSearch}>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div class="site-search-form" role="search">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          type="search"
          bind:this={searchInput}
          bind:value={searchQuery}
          placeholder={searchCopy.placeholder}
          autocomplete="off"
        />
        {#if searchQuery}
          <button type="button" class="compact-clear" onclick={() => (searchQuery = '')} aria-label={searchCopy.clear} title={searchCopy.clear}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        {/if}
      </div>

      <div class="search-result-meta">
        {#if normalizedSearchQuery}
          {searchCopy.showing} "{searchQuery.trim()}", {searchCopy.total} {searchResults.length} {searchCopy.results}
        {:else}
          {data.copy.latest}
        {/if}
      </div>

      <div class="search-results">
        {#each searchResults as article}
          <a href={localizePath(data.lang, `/articles/${article.slug}`)} onclick={closeSearch}>
            <span>{article.topic} · {article.minutes} {data.copy.minutes}</span>
            <strong>{article.title}</strong>
            <p>{article.description}</p>
          </a>
        {:else}
          <div class="empty-state">
            <p>{searchCopy.noResults}</p>
            <button type="button" onclick={() => (searchQuery = '')}>{searchCopy.viewAll}</button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {@render children()}

  <footer class="site-footer">
    <p>{data.copy.siteTitle}</p>
    <nav aria-label={data.copy.socialTitle as string}>
      {#each socialLinks as link}
        <a href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {link.label}
        </a>
      {/each}
    </nav>
  </footer>
</div>
