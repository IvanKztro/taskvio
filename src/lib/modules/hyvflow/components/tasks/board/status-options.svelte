<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { IconDots, IconEdit, IconTrash, IconPlus } from '@tabler/icons-svelte';
	import { isopenstatus, statusActions } from '$lib/modules/hyvflow/stores/actions/status-action';
	import { milestoneActions } from '$lib/modules/hyvflow/stores/actions/milestone-actions';
	import { firekitDocMutations } from 'svelte-firekit';
	import { toast } from 'svelte-sonner';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import type { ArrayStatus } from '$lib/modules/hyvflow/types/milestone';

	let {
		status,
		statusIndex,
		sprintId
	}: {
		status: ArrayStatus;
		statusIndex: number;
		sprintId: string;
	} = $props();

	let open = $state(false);

	function handleNewStatus() {
		statusActions.set(undefined);
		milestoneActions.set(projectManager.milestoneData);
		isopenstatus.set(true);
		open = false;
	}

	function handleEdit() {
		statusActions.set(status);
		milestoneActions.set(projectManager.milestoneData);
		isopenstatus.set(true);
		open = false;
	}

	async function handleDelete() {
		open = false;
		const milestone = projectManager.milestoneData;
		if (!milestone) return;

		const confirmed = confirm(`Delete status "${status.name}"? This cannot be undone.`);
		if (!confirmed) return;

		const updatedStatuses = (milestone.arrayStatus ?? [])
			.filter((_, i) => i !== statusIndex)
			.map((s, i) => ({ ...s, position: i + 1 }));

		const res = await firekitDocMutations.update(
			`projects/${milestone.projectId}/milestones/${milestone.id}`,
			{ arrayStatus: updatedStatuses }
		);

		if (res.success) {
			toast.success('Status deleted successfully');
		} else {
			toast.error('Error deleting status');
		}
	}
</script>

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button variant="ghost" size="icon" class="size-6" {...props}>
				<IconDots class="size-3.5" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-44">
		<DropdownMenu.Item onclick={handleNewStatus} class="gap-2 text-sm">
			<IconPlus class="size-4" />
			New Status
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={handleEdit} class="gap-2 text-sm">
			<IconEdit class="size-4" />
			Edit
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item
			onclick={handleDelete}
			class="gap-2 text-sm text-destructive focus:text-destructive"
		>
			<IconTrash class="size-4" />
			Delete
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
