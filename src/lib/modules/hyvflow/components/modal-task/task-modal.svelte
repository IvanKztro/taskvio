<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		opendependencies,
		remainingTime,
		sideleft
	} from '$lib/modules/hyvflow/stores/actions/tasks-action';
	import { openmodaltask } from '$lib/modules/hyvflow/stores/firestore-batch/batch';
	import TaskModalHeader from './task-modal-header.svelte';
	import { TaskStatus, type Task } from '$lib/modules/hyvflow/types/task';
	import { IconLoader, IconX } from '@tabler/icons-svelte';
	import ModalCenter from './modal-center.svelte';
	import MenuSidebarRight from '../sidebar/right/menu-sidebar-rigth.svelte';

	let {
		membersByProject = [],
		currentTask
	}: {
		membersByProject: any[];
		currentTask: Task | null;
	} = $props();

	let taskName: string = $state(currentTask?.name || '');
	let isLoading = $state(false);

	$effect(() => {
		if (currentTask) {
			taskName = currentTask.name;
			isLoading = false;
		} else if ($openmodaltask) {
			isLoading = true;
		}
	});
</script>

<Dialog.Root
	bind:open={$openmodaltask}
	onOpenChange={(e) => {
		if ($remainingTime > 0) openmodaltask.set(true);
		else openmodaltask.set(false);
	}}
>
	<Dialog.Content
		escapeKeydownBehavior="ignore"
		onOpenAutoFocus={(e) => e.preventDefault()}
		onInteractOutside={(e) => {
			e.preventDefault();
			openmodaltask.set(true);
		}}
		class="fixed m-0 min-h-[90%] min-w-[90%] p-0"
	>
		{#if isLoading || !currentTask}
			<div class="flex h-[500px] items-center justify-center text-2xl">
				<IconLoader class="size-16 animate-spin text-primary" />
			</div>
		{:else if currentTask?.status !== TaskStatus.Canceled}
			<Dialog.Header class="m-0 p-0">
				<Dialog.Title class="h-[50px] w-full border-b border-b-border p-0">
					<TaskModalHeader taskValue={currentTask} />
				</Dialog.Title>
			</Dialog.Header>
			<article class="mx-0 -mt-4 flex w-auto p-0">
				{#if currentTask}
					<section
						id="modal-center-scroll"
						class="w-full overflow-y-auto"
						style="height: calc(100dvh - 120px);"
					>
						<ModalCenter taskValue={currentTask} {membersByProject} bind:taskName />
					</section>
				{/if}
				<MenuSidebarRight taskValue={currentTask} {membersByProject} />
			</article>
		{:else}
			<div class="flex items-center justify-center p-8 text-lg text-muted-foreground">
				<p>Task not found or has been canceled.</p>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
