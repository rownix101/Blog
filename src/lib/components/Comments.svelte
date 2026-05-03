<script lang="ts">
  import { onMount } from 'svelte';

  type CommentCopy = {
    title: string;
    loading: string;
    empty: string;
    disabled: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    bodyLabel: string;
    bodyPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
  };

  type PublicComment = {
    id: number;
    authorName: string;
    body: string;
    createdAt: string;
    optimistic?: boolean;
  };

  let { endpoint, copy, lang } = $props<{
    endpoint: string;
    copy: CommentCopy;
    lang: 'zh' | 'en';
  }>();

  let comments = $state<PublicComment[]>([]);
  let authorName = $state('');
  let authorEmail = $state('');
  let body = $state('');
  let website = $state('');
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
    const optimisticComment = {
      id: -Date.now(),
      authorName: authorName.trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
      optimistic: true
    } satisfies PublicComment;
    const submitted = {
      authorName,
      authorEmail,
      body,
      website
    };

    submitting = true;
    statusMessage = '';
    errorMessage = '';
    comments = [...comments, optimisticComment];
    authorName = '';
    authorEmail = '';
    body = '';
    website = '';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify(submitted)
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
      authorName = submitted.authorName;
      authorEmail = submitted.authorEmail;
      body = submitted.body;
      website = submitted.website;
      errorMessage = error instanceof Error ? error.message : copy.error;
    } finally {
      submitting = false;
    }
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

    <form class="comment-form" onsubmit={(event) => { event.preventDefault(); submitComment(); }}>
      <label>
        <span>{copy.nameLabel}</span>
        <input
          bind:value={authorName}
          name="authorName"
          autocomplete="name"
          maxlength="48"
          placeholder={copy.namePlaceholder}
          required
        />
      </label>

      <label>
        <span>{copy.emailLabel}</span>
        <input
          bind:value={authorEmail}
          name="authorEmail"
          type="email"
          autocomplete="email"
          maxlength="254"
          placeholder={copy.emailPlaceholder}
        />
      </label>

      <label class="comment-website" aria-hidden="true">
        <span>Website</span>
        <input bind:value={website} name="website" tabindex="-1" autocomplete="off" />
      </label>

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
  {/if}
</section>
