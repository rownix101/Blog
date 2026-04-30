<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.page.title} · {data.copy.siteTitle}</title>
  <meta name="description" content={data.page.description} />
  <link rel="canonical" href={data.canonicalUrl} />
  {#each Object.entries(data.alternateUrls) as [lang, href]}
    <link rel="alternate" hreflang={lang} href={href} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={data.alternateUrls.zh} />
</svelte:head>

<main class="legal-page">
  <header class="legal-hero">
    <p class="eyebrow">{data.copy.legal.updated} {data.page.updated}</p>
    <h1>{data.page.title}</h1>
    <p>{data.page.description}</p>
  </header>

  <div class="legal-content">
    {#each data.page.sections as section}
      <section>
        <h2>{section.title}</h2>
        {#each section.body as paragraph}
          <p>{paragraph}</p>
        {/each}
      </section>
    {/each}
  </div>
</main>
