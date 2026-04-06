<script lang="ts">
	import type { Task } from '$lib/modules/hyvflow/types/task';
	import IconGitMerge from '@tabler/icons-svelte/icons/git-merge';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let {
		relationships = [],
		task
	}: {
		relationships?: any[];
		task: Task;
	} = $props();

	let count = $derived(relationships?.length ?? 0);
</script>

{#if count > 0}
	<Tooltip.Root>
		<Tooltip.Trigger>
			<span
				class="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
			>
				<IconGitMerge class="size-3" />
				{count}
			</span>
		</Tooltip.Trigger>
		<Tooltip.Content class="max-w-48">
			<p class="mb-1 text-xs font-semibold">Dependencies ({count})</p>
			<ul class="space-y-0.5">
				{#each relationships as rel}
					<li class="text-xs text-muted-foreground">
						{rel?.title ?? rel?.name ?? rel?.id ?? 'Dependency'}
					</li>
				{/each}
			</ul>
		</Tooltip.Content>
	</Tooltip.Root>
{/if}
