<script lang="ts">
  import { localizePath } from '$lib/i18n';

  let { data } = $props();

  const copy = $derived(data.copy.auth as {
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
    haveAccount: string;
    noAccount: string;
  });

  let email = $state('');
  let displayName = $state('');
  let submitting = $state(false);
  let done = $state(false);
  let errorMessage = $state('');

  const submit = async () => {
    submitting = true;
    errorMessage = '';
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, displayName, lang: data.lang })
      });
      if (!res.ok) {
        const result = await res.json();
        errorMessage = result.message ?? copy.errorGeneric;
      } else {
        done = true;
      }
    } catch {
      errorMessage = copy.errorGeneric;
    } finally {
      submitting = false;
    }
  };
</script>

<svelte:head>
  <title>{copy.registerTitle} · {data.copy.siteTitle as string}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="auth-page">
  <div class="auth-card">
    <h1>{copy.registerTitle}</h1>

    {#if done}
      <p class="auth-notice">{copy.checkEmail}</p>
    {:else}
      <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
        <label>
          <span>{copy.displayNameLabel}</span>
          <input
            bind:value={displayName}
            type="text"
            name="displayName"
            autocomplete="nickname"
            maxlength="48"
            placeholder={copy.displayNamePlaceholder}
            required
          />
        </label>

        <label>
          <span>{copy.emailLabel}</span>
          <input
            bind:value={email}
            type="email"
            name="email"
            autocomplete="email"
            placeholder={copy.emailPlaceholder}
            required
          />
        </label>

        {#if errorMessage}
          <p class="auth-error">{errorMessage}</p>
        {/if}

        <button type="submit" disabled={submitting}>
          {submitting ? copy.submitting : copy.registerSubmit}
        </button>
      </form>

      <p class="auth-switch">
        {copy.haveAccount}
        <a href={localizePath(data.lang, '/auth/login')}>{copy.loginTitle}</a>
      </p>
    {/if}
  </div>
</main>
