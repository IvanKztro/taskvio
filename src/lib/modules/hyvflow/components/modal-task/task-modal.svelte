<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { IconTrash, IconX } from '@tabler/icons-svelte';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { openmodaltask, currentTaskID } from '$lib/modules/hyvflow/stores/firestore-batch/batch';
	import {
		isopendeletetask,
		tasktodelete,
		milestoneInfo,
		sideleft
	} from '$lib/modules/hyvflow/stores/actions/tasks-action';
	import type { Task } from '$lib/modules/hyvflow/types/task';
	import { TaskPriority, TaskStatus } from '$lib/modules/hyvflow/types/task';
	import IconFlag from '$lib/modules/hyvflow/components/icon-flag.svelte';
	import TaskAssigneesView from '$lib/modules/hyvflow/components/tasks/task-assignees-view.svelte';
	import { toast } from 'svelte-sonner';
	import { DateFormatter, getLocalTimeZone, fromDate } from '@internationalized/date';

	let {
		currentTask,
		membersByProject = []
	}: {
		currentTask: Task | null;
		membersByProject: any[];
	} = $props();

	let isOpen = $derived($openmodaltask);
	let milestone = $derived(projectManager.milestoneData);

	// Editable local state (syncs when task changes)
	let name = $state('');
	let description = $state('');
	let priority = $state<string>('');
	let status = $state<string>('');
	let saving = $state(false);

	const df = new DateFormatter('en-US', { dateStyle: 'medium' });

	$effect(() => {
		if (currentTask) {
			name = currentTask.name ?? '';
			description = (currentTask.content as string) ?? '';
			priority = currentTask.priority ?? '';
			status = currentTask.status ?? '';
		}
	});

	function formatDate(ts: any): string {
		if (!ts?.seconds) return '';
		return new Date(ts.seconds * 1000).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	async function handleSave() {
		if (!currentTask) return;
		saving = true;
		try {
			taskManager.setIds(projectManager.projectId, projectManager.milestoneId);
			await taskManager.updateTask(
				{
					name: name.trim() || currentTask.name,
					priority: priority as any,
					status,
					content: description
				},
				currentTask.id
			);
			toast.success('Task saved');
		} catch {
			toast.error('Error saving task');
		} finally {
			saving = false;
		}
	}

	function handleDelete() {
		if (!currentTask || !milestone) return;
		tasktodelete.set(currentTask);
		milestoneInfo.set(milestone);
		openmodaltask.set(false);
		isopendeletetask.set(true);
	}

	function handleClose() {
		openmodaltask.set(false);
		currentTaskID.set(undefined);
	}

	const priorities = [
		{ value: TaskPriority.Urgent, label: 'Urgent' },
		{ value: TaskPriority.High, label: 'High' },
		{ value: TaskPriority.Normal, label: 'Normal' },
		{ value: TaskPriority.Low, label: 'Low' }
	];

	const statuses = [
		{ value: TaskStatus.Active, label: 'To Do' },
		{ value: TaskStatus.InProgress, label: 'In Progress' },
		{ value: TaskStatus.InReview, label: 'In Review' },
		{ value: TaskStatus.Complete, label: 'Complete' },
		{ value: TaskStatus.Paused, label: 'Paused' }
	];
</script>

<Dialog.Root
	open={isOpen}
	onOpenChange={(val) => {
		if (!val) handleClose();
	}}
>
	<Dialog.Content class="max-w-2xl">
		{#if currentTask}
			<Dialog.Header>
				<!-- Editable task name -->
				<Input
					bind:value={name}
					class="border-none bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
					placeholder="Task name..."
				/>
			</Dialog.Header>

			<div class="flex flex-col gap-4 py-2">
				<!-- Meta row: priority + status + assignees -->
				<div class="flex flex-wrap items-center gap-3">
					<!-- Priority -->
					<div class="flex items-center gap-1.5">
						<span class="text-xs text-muted-foreground">Priority</span>
						<select
							bind:value={priority}
							class="h-7 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
						>
							<option value="">None</option>
							{#each priorities as p}
								<option value={p.value}>{p.label}</option>
							{/each}
						</select>
					</div>

					<!-- Status -->
					<div class="flex items-center gap-1.5">
						<span class="text-xs text-muted-foreground">Status</span>
						<select
							bind:value={status}
							class="h-7 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
						>
							{#each statuses as s}
								<option value={s.value}>{s.label}</option>
							{/each}
						</select>
					</div>

					<!-- Assignees -->
					<div class="flex items-center gap-1.5">
						<span class="text-xs text-muted-foreground">Assignees</span>
						<TaskAssigneesView task={currentTask} iconsize="size-6" />
					</div>
				</div>

				<!-- Dates -->
				<div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
					{#if currentTask.startDate}
						<span>Start: {formatDate(currentTask.startDate)}</span>
					{/if}
					{#if currentTask.dueDate}
						<span>Due: {formatDate(currentTask.dueDate)}</span>
					{/if}
				</div>

				<!-- Description -->
				<div class="space-y-1">
					<label class="text-xs font-medium text-muted-foreground">Description</label>
					<Textarea
						bind:value={description}
						placeholder="Add a description..."
						class="min-h-[120px] resize-y text-sm"
					/>
				</div>

				<!-- Task tree (sideleft == 'threeview') -->
				{#if $sideleft === 'threeview'}
					<div class="rounded-md border border-border/50 bg-muted/20 p-3">
						<p class="text-xs font-medium text-muted-foreground">Subtasks</p>
						<p class="mt-1 text-sm text-muted-foreground">
							{(currentTask.tasks?.length ?? 0)} subtask{(currentTask.tasks?.length ?? 0) !== 1 ? 's' : ''}
						</p>
					</div>
				{/if}
			</div>

			<!-- Footer actions -->
			<Dialog.Footer class="flex items-center justify-between gap-2">
				<Button
					variant="ghost"
					size="sm"
					class="gap-1.5 text-destructive hover:text-destructive"
					onclick={handleDelete}
				>
					<IconTrash class="size-4" />
					Delete
				</Button>

				<div class="flex gap-2">
					<Button variant="outline" size="sm" onclick={handleClose}>Cancel</Button>
					<Button size="sm" onclick={handleSave} disabled={saving}>
						{saving ? 'Saving...' : 'Save'}
					</Button>
				</div>
			</Dialog.Footer>
		{:else}
			<Dialog.Header>
				<Dialog.Title>Task not found</Dialog.Title>
			</Dialog.Header>
		{/if}
	</Dialog.Content>
</Dialog.Root>
