<script lang="ts">
  import ErrorPage from '$lib/components/ErrorPage.svelte';

  let { data } = $props();
</script>

<ErrorPage lang={data.lang} copy={data.copy} latestArticles={data.latestArticles} />
