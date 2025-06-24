import type { HTMLAttributes } from 'svelte/elements';

export type TableProps = HTMLAttributes<HTMLTableElement>;
export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;
export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;
export type TableFooterProps = HTMLAttributes<HTMLTableSectionElement>;
export type TableHeadProps = HTMLAttributes<HTMLTableCellElement>;
export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;
export type TableCellProps = HTMLAttributes<HTMLTableCellElement>;
export type TableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>;

export { default as Table } from './Table.svelte';
export { default as TableBody } from './TableBody.svelte';
export { default as TableCell } from './TableCell.svelte';
export { default as TableHead } from './TableHead.svelte';
export { default as TableHeader } from './TableHeader.svelte';
export { default as TableRow } from './TableRow.svelte'; 