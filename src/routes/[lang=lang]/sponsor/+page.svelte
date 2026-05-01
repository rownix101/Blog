<script lang="ts">
  let { data } = $props();

  const copy = $derived(data.copy.sponsor as {
    title: string;
    eyebrow: string;
    intro: string;
    amountLabel: string;
    amountHelp: string;
    methodLabel: string;
    methods: Record<string, string>;
    cryptoPriceNote: string;
    submit: string;
    success: string;
    privacyPrefix: string;
    privacyJoin: string;
    privacySuffix: string;
  });
  const legalCopy = $derived(data.copy.legal as {
    privacy: string;
    terms: string;
  });

  const presetAmounts = ['9.90', '19.90', '49.90', '99.00'];
  let selectedAmount = $state('19.90');
  let customAmount = $state('');
  let selectedPayType = $state('alipay');
  const amountPrefix = $derived(selectedPayType === 'crypto' ? '$' : '¥');

  const selectPresetAmount = (amount: string) => {
    selectedAmount = amount;
    customAmount = '';
  };

  const selectCustomAmount = () => {
    selectedAmount = '';
  };
</script>

<svelte:head>
  <title>{copy.title} · {data.copy.siteTitle}</title>
  <meta name="description" content={copy.intro} />
  <link rel="canonical" href={data.canonicalUrl} />
  {#each Object.entries(data.alternateUrls) as [lang, href]}
    <link rel="alternate" hreflang={lang} href={href} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={data.alternateUrls.zh} />
</svelte:head>

<main class="sponsor-page">
  <section class="sponsor-hero">
    <p class="eyebrow">{copy.eyebrow}</p>
    <h1>{copy.title}</h1>
    <p>{copy.intro}</p>
  </section>

  <section class="sponsor-checkout" aria-labelledby="sponsor-checkout-title">
    <div>
      <p class="eyebrow" id="sponsor-checkout-title">{copy.amountLabel}</p>
      <p>{copy.amountHelp}</p>
      {#if data.paid}
        <p class="sponsor-success">{copy.success}</p>
      {/if}
    </div>

    <form method="post" action="/api/sponsor/checkout" class="sponsor-form">
      <input type="hidden" name="lang" value={data.lang} />
      <fieldset>
        <legend>{copy.amountLabel}</legend>
        <div class="amount-grid">
          {#each presetAmounts as amount}
            <label>
              <input
                type="radio"
                name="amount"
                value={amount}
                checked={selectedAmount === amount}
                onchange={() => selectPresetAmount(amount)}
              />
              <span>{amountPrefix}{amount}</span>
            </label>
          {/each}
        </div>
        <label class="custom-amount">
          <span>{copy.amountHelp}</span>
          <input
            type="number"
            name="custom_amount"
            bind:value={customAmount}
            min="1"
            max="5000"
            step="0.01"
            inputmode="decimal"
            placeholder="88.00"
            onfocus={selectCustomAmount}
            oninput={selectCustomAmount}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>{copy.methodLabel}</legend>
        <div class="method-grid">
          {#each Object.entries(copy.methods) as [value, label], index}
            <label>
              <input
                type="radio"
                name="pay_type"
                value={value}
                checked={index === 0}
                onchange={() => (selectedPayType = value)}
              />
              <span>{label}</span>
            </label>
          {/each}
        </div>
        {#if selectedPayType === 'crypto'}
          <p class="method-note">{copy.cryptoPriceNote}</p>
        {/if}
      </fieldset>

      <p>
        {copy.privacyPrefix}
        <a href="/{data.lang}/privacy">{legalCopy.privacy}</a>
        {copy.privacyJoin}
        <a href="/{data.lang}/terms">{legalCopy.terms}</a>{copy.privacySuffix}
      </p>
      <button type="submit">{copy.submit}</button>
    </form>
  </section>
</main>
