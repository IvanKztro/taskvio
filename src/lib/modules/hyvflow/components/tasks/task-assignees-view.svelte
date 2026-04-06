<script lang="ts">
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { getInitials } from '$lib/utils';
	import type { Task } from '$lib/modules/hyvflow/types/task';

	let {
		task,
		iconsize = 'size-6'
	}: {
		task: Task;
		iconsize?: string;
	} = $props();

	const MAX_VISIBLE = 3;

	let assigneeUsers = $derived.by(() => {
		if (!task.assignees?.length) return [];
		return task.assignees
			.map((uid) => projectManager.projectMembers.find((m) => m.uid === uid || m.id === uid))
			.filter(Boolean);
	});

	let visible = $derived(assigneeUsers.slice(0, MAX_VISIBLE));
	let overflow = $derived(assigneeUsers.length - MAX_VISIBLE);
</script>

{#if assigneeUsers.length > 0}
	<div class="flex -space-x-1.5">
		{#each visible as member}
			<Avatar.Root class="{iconsize} ring-1 ring-background">
				{#if member.photoURL}
					<Avatar.Image src={member.photoURL} alt={member.displayName ?? member.name ?? ''} />
				{/if}
				<Avatar.Fallback class="text-[9px]">
					{getInitials(member.displayName ?? member.name ?? '')}
				</Avatar.Fallback>
			</Avatar.Root>
		{/each}
		{#if overflow > 0}
			<div
				class="{iconsize} ring-1 ring-background flex items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground"
			>
				+{overflow}
			</div>
		{/if}
	</div>
{/if}
