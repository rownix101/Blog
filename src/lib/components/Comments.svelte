<script lang="ts">
  import { onMount } from 'svelte';
  import { localizePath } from '$lib/i18n';

  type CommentCopy = {
    title: string;
    loading: string;
    empty: string;
    disabled: string;
    bodyLabel: string;
    bodyPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    loginToComment: string;
    loginLink: string;
    commentingAs: string;
    logout: string;
  };

  type PublicComment = {
    id: number;
    authorName: string;
    body: string;
    createdAt: string;
    optimistic?: boolean;
  };

  let { endpoint, copy, lang, user } = $props<{
    endpoint: string;
    copy: CommentCopy;
    lang: 'zh' | 'en';
    user: { id: number; email: string; displayName: string } | null;
  }>();

  let comments = $state<PublicComment[]>([]);
  let body = $state('');
  let loading = $state(true);
  let submitting = $state(false);
  let enabled = $state(true);
  let statusMessage = $state('');
  let errorMessage = $state('');

  const dateFormatter = $derived(
    new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  );

  const loadComments = async () => {
    loading = true;
    errorMessage = '';

    try {
      const response = await fetch(endpoint, {
        cache: 'no-store',
        headers: { accept: 'application/json' }
      });
      const result = await response.json();

      enabled = Boolean(result.enabled);
      comments = Array.isArray(result.comments) ? result.comments : [];
    } catch {
      enabled = false;
      errorMessage = copy.error;
    } finally {
      loading = false;
    }
  };

  const submitComment = async () => {
    if (!user) return;

    const optimisticComment = {
      id: -Date.now(),
      authorName: user.displayName,
      body: body.trim(),
      createdAt: new Date().toISOString(),
      optimistic: true
    } satisfies PublicComment;
    const submittedBody = body;

    submitting = true;
    statusMessage = '';
    errorMessage = '';
    comments = [...comments, optimisticComment];
    body = '';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ body: submittedBody })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || copy.error);
      }

      comments = result.comment
        ? comments.map((comment) => (comment.id === optimisticComment.id ? result.comment : comment))
        : comments.filter((comment) => comment.id !== optimisticComment.id);
      statusMessage = copy.success;
    } catch (error) {
      comments = comments.filter((comment) => comment.id !== optimisticComment.id);
      body = submittedBody;
      errorMessage = error instanceof Error ? error.message : copy.error;
    } finally {
      submitting = false;
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  onMount(loadComments);
</script>

<section class="comments-panel" aria-labelledby="comments-title">
  <h2 id="comments-title">{copy.title}</h2>

  {#if loading}
    <p class="comments-note">{copy.loading}</p>
  {:else if !enabled}
    <p class="comments-note">{copy.disabled}</p>
  {:else}
    <div class="comments-list" aria-live="polite">
      {#if comments.length}
        {#each comments as comment (comment.id)}
          <article class="comment-item" class:comment-pending={comment.optimistic}>
            <header>
              <strong>{comment.authorName}</strong>
              <time datetime={comment.createdAt}>{dateFormatter.format(new Date(comment.createdAt))}</time>
            </header>
            <p>{comment.body}</p>
          </article>
        {/each}
      {:else}
        <p class="comments-note">{copy.empty}</p>
      {/if}
    </div>

    {#if user}
      <form class="comment-form" onsubmit={(event) => { event.preventDefault(); submitComment(); }}>
        <p class="comment-identity">
          {copy.commentingAs} <strong>{user.displayName}</strong>
          <button type="button" class="link-button" onclick={logout}>{copy.logout}</button>
        </p>

        <label class="comment-body">
          <span>{copy.bodyLabel}</span>
          <textarea
            bind:value={body}
            name="body"
            minlength="2"
            maxlength="1200"
            rows="5"
            placeholder={copy.bodyPlaceholder}
            required
          ></textarea>
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? copy.submitting : copy.submit}
        </button>

        {#if statusMessage}
          <p class="comment-status">{statusMessage}</p>
        {/if}
        {#if errorMessage}
          <p class="comment-error">{errorMessage}</p>
        {/if}
      </form>
    {:else}
      <p class="comment-login-prompt">
        {copy.loginToComment}
        <a href={localizePath(lang, '/auth/login')}>{copy.loginLink}</a>
      </p>
    {/if}
  {/if}
</section>
