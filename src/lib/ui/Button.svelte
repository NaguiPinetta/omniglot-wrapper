<script lang="ts">
  import { getButtonClasses } from './button';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface $$Props extends HTMLButtonAttributes {
    variant?: 'default' | 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
  }

  export let variant: $$Props['variant'] = 'default';
  export let size: $$Props['size'] = 'md';
  export let type: $$Props['type'] = 'button';
  export let disabled: $$Props['disabled'] = false;

  $: classes = getButtonClasses({ variant, size });
</script>

<button
  {type}
  {disabled}
  class={classes}
  {...$$restProps}
  on:click
>
  <slot />
</button> 