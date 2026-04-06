<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import {
		IconDotsVertical,
		IconStar,
		IconStarFilled,
		IconEdit,
		IconLink,
		IconCopy,
		IconTrash
	} from '@tabler/icons-svelte';
	import type { Task } from '$lib/modules/hyvflow/types/task';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import {
		currentTaskID,
		openmodaltask
	} from '$lib/modules/hyvflow/stores/firestore-batch/batch';
	import {
		isopendeletetask,
		tasktodelete,
		milestoneInfo
	} from '$lib/modules/hyvflow/stores/actions/tasks-action';
	import { cloneTaskBatch } from '$lib/modules/hyvflow/stores/firestore-batch/task-batch';
	import { favoriteManager } from '$lib/modules/hyvflow/stores/favorites-manager.svelte';
	import ButtonFavorites from '$lib/modules/hyvflow/components/favorites/button-favorites.svelte';

	let {
		task,
		isdialog = false
	}: {
		task: Task;
		isdialog?: boolean;
	} = $props();

	let open = $state(false);

	let milestone = $derived(projectManager.milestoneData);
	let isFav = $derived(favoriteManager.isFavorite('subtask', task.id));

	function handleEdit() {
		currentTaskID.set(task.id);
		openmodaltask.set(true);
		open = false;
	}

	async function handleCopyLink() {
		if (!milestone) return;
		const url = `${$page.url.origin}/p/${milestone.projectId}/m/${milestone.id}/${task.id}`;
		await navigator.clipboard.writeText(url);
		toast.success('Link copied to clipboard');
		open = false;
	}

	async function handleClone() {
		open = false;
		if (!milestone) return;
		try {
			await cloneTaskBatch(task, milestone);
		} catch {
			// toast shown by cloneTaskBatch
		}
	}

	function handleDelete() {
		tasktodelete.set(task);
		milestoneInfo.set(milestone ?? null);
		isopendeletetask.set(true);
		open = false;
	}
</script>

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button variant="ghost" size="icon" class="size-7" {...props}>
				<IconDotsVertical class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-48">
		<!-- Favorites toggle inline -->
		<DropdownMenu.Item
			onclick={() => {
				if (isFav) {
					favoriteManager.removeFavFromUser('subtask', isFav.value);
				} else {
					favoriteManager.updateFavoriteItem('subtask', task.id);
				}
				open = false;
			}}
			class="gap-2 text-sm"
		>
			{#if isFav}
				<IconStarFilled class="size-4 text-yellow-400" />
				Remove Favorite
			{:else}
				<IconStar class="size-4" />
				Add Favorite
			{/if}
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
