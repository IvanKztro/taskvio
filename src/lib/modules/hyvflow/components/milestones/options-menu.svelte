<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import {
		IconDots,
		IconEdit,
		IconLink,
		IconCopy,
		IconTrash,
		IconPlus
	} from '@tabler/icons-svelte';
	import type { Milestone } from '$lib/modules/hyvflow/types/milestone';
	import type { Project } from '$lib/modules/hyvflow/types/project';
	import {
		isopenmilestone,
		isopendeletemilestone,
		milestoneActions,
		projectIdStore
	} from '$lib/modules/hyvflow/stores/actions/milestone-actions';
	import {
		isopensprint,
		sprintActions,
		sprintsActions
	} from '$lib/modules/hyvflow/stores/actions/sprint-action';
	import { cloneMilestoneBatch } from '$lib/modules/hyvflow/stores/firestore-batch/milestone-batch';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { firekitCollection } from 'svelte-firekit';
	import { where } from 'firebase/firestore';
	import { toast } from 'svelte-sonner';
	import type { Task } from '$lib/modules/hyvflow/types/task';
	import { TaskStatus } from '$lib/modules/hyvflow/types/task';

	let {
		milestone,
		project
	}: {
		milestone: Milestone;
		project: Project;
	} = $props();

	let open = $state(false);

	function handleEdit() {
		milestoneActions.set(milestone);
		projectIdStore.set(project.id);
		isopenmilestone.set(true);
		open = false;
	}

	function handleCreateSprint() {
		milestoneActions.set(milestone);
		sprintActions.set(undefined);
		sprintsActions.set(milestone.arraySprints ?? []);
		isopensprint.set(true);
		open = false;
	}

	async function handleCopyLink() {
		const url = `${window.location.origin}/p/${project.id}/m/${milestone.id}`;
		await navigator.clipboard.writeText(url);
		toast.success('Link copied to clipboard');
		open = false;
	}

	async function handleClone() {
		open = false;
		try {
			const tasksCollection = firekitCollection<Task>(
				`projects/${project.id}/milestones/${milestone.id}/tasks`,
				[where('status', '!=', TaskStatus.Canceled)]
			);
			const tasks = await tasksCollection.getFromServer();
			await cloneMilestoneBatch({ ...milestone, tasks });
		} catch {
			// toast is shown by cloneMilestoneBatch
		}
	}

	function handleDelete() {
		milestoneActions.set(milestone);
		isopendeletemilestone.set(true);
		open = false;
	}
</script>

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button variant="ghost" size="icon" class="size-7" {...props}>
				<IconDots class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-48">
		<DropdownMenu.Item onclick={handleCreateSprint} class="gap-2 text-sm">
			<IconPlus class="size-4" />
			Create Sprint
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={handleEdit} class="gap-2 text-sm">
			<IconEdit class="size-4" />
			Edit
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={handleCopyLink} class="gap-2 text-sm">
			<IconLink class="size-4" />
			Copy Link
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={handleClone} class="gap-2 text-sm">
			<IconCopy class="size-4" />
			Clone
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
