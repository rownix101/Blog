<script lang="ts">
  import { languageOptions, languages, localizePath, type Lang } from '$lib/i18n';
  import type { ArticleSummary } from '$lib/content';
  import { socialLinks } from '$lib/profile';
  import { page } from '$app/state';
  import { tick } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  let { data, children } = $props();
  let searchOpen = $state(false);
  let searchQuery = $state('');
  let searchInput = $state<HTMLInputElement | null>(null);
  let loadedSearchArticles = $state<ArticleSummary[]>([]);
  let searchLoaded = $state(false);
  let searchLoading = $state(false);

  // Auth modal state
  let authOpen = $state(false);
  let authTab = $state<'login' | 'register'>('login');
  let authEmail = $state('');
  let authDisplayName = $state('');
  let authSubmitting = $state(false);
  let authDone = $state(false);
  let authError = $state('');

  const navItems = [
    { key: 'home', href: '' },
    { key: 'articles', href: '#articles' },
    { key: 'topics', href: '#topics' },
    { key: 'about', href: '/about' },
    { key: 'sponsor', href: '/sponsor' }
  ] as const;
  const legalItems = [
    { key: 'privacy', href: '/privacy' },
    { key: 'cookies', href: '/cookies' },
    { key: 'terms', href: '/terms' }
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
  const legalCopy = $derived(data.copy.legal as {
    title: string;
    privacy: string;
    cookies: string;
    terms: string;
  });
  const authCopy = $derived(data.copy.auth as {
    registerTitle: string;
    loginTitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    registerSubmit: string;
    loginSubmit: string;
    submitting: string;
    checkEmail: string;
    errorGeneric: string;
    errorInvalid: string;
    errorUnverified: string;
    haveAccount: string;
    noAccount: string;
    logout: string;
    orContinueWith: string;
  });
  const normalizedSearchQuery = $derived(searchQuery.trim().toLocaleLowerCase());
  const availableSearchArticles = $derived(searchLoaded ? loadedSearchArticles : data.latestArticles);
  const searchResults = $derived(
    normalizedSearchQuery
      ? availableSearchArticles.filter((article) =>
          [article.title, article.description, article.topic]
            .join(' ')
            .toLocaleLowerCase()
            .includes(normalizedSearchQuery)
        )
      : data.latestArticles
  );

  const closeSearch = () => {
    searchOpen = false;
    searchQuery = '';
  };

  const openSearch = async () => {
    searchOpen = true;
    await tick();
    searchInput?.focus();
    void loadSearchArticles();
  };

  const loadSearchArticles = async () => {
    if (searchLoaded || searchLoading) return;

    searchLoading = true;
    try {
      const response = await fetch(`/api/search/${data.lang}`);
      if (response.ok) {
        loadedSearchArticles = await response.json();
        searchLoaded = true;
      }
    } finally {
      searchLoading = false;
    }
  };

  const openAuth = (tab: 'login' | 'register') => {
    authTab = tab;
    authEmail = '';
    authDisplayName = '';
    authDone = false;
    authError = '';
    authOpen = true;
  };

  const closeAuth = () => {
    authOpen = false;
  };

  const switchTab = (tab: 'login' | 'register') => {
    authTab = tab;
    authEmail = '';
    authDisplayName = '';
    authDone = false;
    authError = '';
  };

  const submitAuth = async () => {
    authSubmitting = true;
    authError = '';
    try {
      const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body: Record<string, string> = { email: authEmail, lang: data.lang };
      if (authTab === 'register') body.displayName = authDisplayName;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const result = await res.json();
        authError = result.message ?? authCopy.errorGeneric;
      } else {
        authDone = true;
      }
    } catch {
      authError = authCopy.errorGeneric;
    } finally {
      authSubmitting = false;
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await invalidateAll();
  };
</script>

<svelte:head>
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

    {#if data.user}
      <div class="header-user">
        <span class="header-user-name">{data.user.displayName}</span>
        <button type="button" class="header-logout" onclick={logout}>
          {authCopy.logout}
        </button>
      </div>
    {:else}
      <button type="button" class="header-login" onclick={() => openAuth('login')}>
        {authCopy.loginTitle}
      </button>
    {/if}

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

  {#if authOpen}
    <div class="auth-backdrop" role="presentation" onclick={closeAuth}></div>
    <div
      class="auth-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div class="auth-modal-header">
        <div class="auth-tabs">
          <button
            type="button"
            class:auth-tab-active={authTab === 'login'}
            onclick={() => switchTab('login')}
          >{authCopy.loginTitle}</button>
          <button
            type="button"
            class:auth-tab-active={authTab === 'register'}
            onclick={() => switchTab('register')}
          >{authCopy.registerTitle}</button>
        </div>
        <button type="button" class="icon-button" aria-label={searchCopy.close} onclick={closeAuth}>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </button>
      </div>

      <h2 id="auth-modal-title" class="auth-modal-title">
        {authTab === 'login' ? authCopy.loginTitle : authCopy.registerTitle}
      </h2>

      {#if authDone}
        <p class="auth-notice">{authCopy.checkEmail}</p>
      {:else}
        <form class="auth-form" onsubmit={(e) => { e.preventDefault(); submitAuth(); }}>
          {#if authTab === 'register'}
            <label>
              <span>{authCopy.displayNameLabel}</span>
              <input
                bind:value={authDisplayName}
                type="text"
                name="displayName"
                autocomplete="nickname"
                maxlength="48"
                placeholder={authCopy.displayNamePlaceholder}
                required
              />
            </label>
          {/if}

          <label>
            <span>{authCopy.emailLabel}</span>
            <input
              bind:value={authEmail}
              type="email"
              name="email"
              autocomplete="email"
              placeholder={authCopy.emailPlaceholder}
              required
            />
          </label>

          {#if authError}
            <p class="auth-error">{authError}</p>
          {/if}

          <button type="submit" disabled={authSubmitting}>
            {authSubmitting
              ? authCopy.submitting
              : authTab === 'login'
                ? authCopy.loginSubmit
                : authCopy.registerSubmit}
          </button>
        </form>

        <div class="auth-divider">
          <span>{authCopy.orContinueWith}</span>
        </div>

        <div class="auth-oauth">
          <a
            class="auth-oauth-btn auth-oauth-google"
            href={`/api/auth/oauth/google?returnTo=${encodeURIComponent(page.url.pathname)}&lang=${data.lang}`}
            aria-label="Google"
          >
            <!-- Google "G" logo -->
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Google</span>
          </a>

          <a
            class="auth-oauth-btn auth-oauth-x"
            href={`/api/auth/oauth/x?returnTo=${encodeURIComponent(page.url.pathname)}&lang=${data.lang}`}
            aria-label="X"
          >
            <!-- X logo -->
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>X</span>
          </a>
        </div>

        <p class="auth-switch">
          {authTab === 'login' ? authCopy.noAccount : authCopy.haveAccount}
          <button type="button" onclick={() => switchTab(authTab === 'login' ? 'register' : 'login')}>
            {authTab === 'login' ? authCopy.registerTitle : authCopy.loginTitle}
          </button>
        </p>
      {/if}
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
    <nav aria-label={legalCopy.title}>
      {#each legalItems as item}
        <a href={localizePath(data.lang, item.href)}>
          {legalCopy[item.key]}
        </a>
      {/each}
    </nav>
  </footer>
</div>
