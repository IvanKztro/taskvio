<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { IconDots, IconEdit, IconLink, IconCopy, IconTrash } from '@tabler/icons-svelte';
	import type { Project } from '$lib/modules/hyvflow/types/project';
	import {
		isopenproject,
		isopendeleteproject,
		projectActions
	} from '$lib/modules/hyvflow/stores/actions/project-action';
	import { cloneProjectBatch } from '$lib/modules/hyvflow/stores/firestore-batch/project-batch';
	import { toast } from 'svelte-sonner';

	let { project }: { project: Project } = $props();

	let open = $state(false);

	function handleEdit() {
		projectActions.set(project);
		isopenproject.set(true);
		open = false;
	}

	async function handleCopyLink() {
		const url = `${window.location.origin}/p/${project.id}`;
		await navigator.clipboard.writeText(url);
		toast.success('Link copied to clipboard');
		open = false;
	}

	async function handleClone() {
		open = false;
		await cloneProjectBatch(project);
	}

	function handleDelete() {
		projectActions.set(project);
		isopendeleteproject.set(true);
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
	<DropdownMenu.Content align="end" class="w-44">
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
