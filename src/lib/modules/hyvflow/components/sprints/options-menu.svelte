<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { IconDots, IconEdit, IconTrash, IconPlus } from '@tabler/icons-svelte';
	import type { SprintApp } from '$lib/modules/hyvflow/types/milestone';
	import {
		isopensprint,
		sprintActions,
		sprintsActions,
		isopendeletesprint
	} from '$lib/modules/hyvflow/stores/actions/sprint-action';
	import { milestoneActions } from '$lib/modules/hyvflow/stores/actions/milestone-actions';
	import { isopenstatus, statusActions } from '$lib/modules/hyvflow/stores/actions/status-action';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { cn } from '$lib/utils';

	let {
		className,
		sprint
	}: {
		className?: string;
		sprint: SprintApp;
	} = $props();

	let open = $state(false);

	function handleEdit() {
		milestoneActions.set(projectManager.milestoneData);
		sprintActions.set(sprint);
		sprintsActions.set(projectManager.milestoneData?.arraySprints ?? []);
		isopensprint.set(true);
		open = false;
	}

	function handleDelete() {
		milestoneActions.set(projectManager.milestoneData);
		sprintActions.set(sprint);
		sprintsActions.set(projectManager.milestoneData?.arraySprints ?? []);
		isopendeletesprint.set(true);
		open = false;
	}

	function handleNewStatus() {
		statusActions.set(undefined);
		milestoneActions.set(projectManager.milestoneData);
		isopenstatus.set(true);
		open = false;
	}
</script>

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				variant="ghost"
				size="icon"
				class={cn('size-6', className)}
				{...props}
			>
				<IconDots class="size-3.5" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-44">
		<DropdownMenu.Item onclick={handleEdit} class="gap-2 text-sm">
			<IconEdit class="size-4" />
			Edit
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={handleNewStatus} class="gap-2 text-sm">
			<IconPlus class="size-4" />
			New Status
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
