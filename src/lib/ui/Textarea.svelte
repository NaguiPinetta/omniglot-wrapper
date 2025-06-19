<script lang="ts">
  import { getTextareaClasses } from './textarea';
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface $$Props extends Omit<HTMLTextareaAttributes, 'value'> {
    value?: string;
    error?: boolean;
    resize?: boolean;
  }

  export let value: string | undefined = undefined;
  export let error: boolean = false;
  export let resize: boolean = true;
  export let rows: number = 3;
  export let disabled: boolean = false;

  $: classes = getTextareaClasses({ error, resize });
</script>

<textarea
  bind:value
  {rows}
  {disabled}
  class={classes}
  {...$$restProps}
  on:input
  on:change
  on:focus
  on:blur
/> 