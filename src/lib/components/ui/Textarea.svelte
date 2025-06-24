<script lang="ts">
  import { cn } from '$lib/utils';

  export let value: string | undefined = undefined;
  export let resize: boolean = true;
  export let rows: number = 3;
  export let disabled: boolean = false;
  let className: string | undefined = undefined;
	export { className as class };
</script>

<textarea
  bind:value
  {rows}
  {disabled}
  class={cn('flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-black shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', className, resize ? '' : 'resize-none')}
  {...$$restProps}
  on:input
  on:change
  on:focus
  on:blur
></textarea> 