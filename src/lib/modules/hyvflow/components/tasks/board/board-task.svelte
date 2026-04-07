<script lang="ts">
	import type { Task } from '$lib/modules/hyvflow/types/task';
	import { TaskStatus } from '$lib/modules/hyvflow/types/task';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { currentTaskID, openmodaltask } from '$lib/modules/hyvflow/stores/firestore-batch/batch';
	import { getLengthComments } from '$lib/utils';
	import { firekitUser, firekitCollection } from 'svelte-firekit';
	import { where, orderBy } from 'firebase/firestore';
	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import {
		IconDots,
		IconSubtask,
		IconMessage,
		IconFile,
		IconChecklist,
		IconChevronDown,
		IconChevronRight
	} from '@tabler/icons-svelte';
	import TaskExpiryIndicator from '$lib/modules/hyvflow/components/tasks/board/task-expiry-indicator.svelte';
	import TaskAssigneesView from '$lib/modules/hyvflow/components/tasks/task-assignees-view.svelte';
	import IconFlag from '$lib/modules/hyvflow/components/icon-flag.svelte';
	import BoardChecklist from '$lib/modules/hyvflow/components/tasks/board/board-checklist.svelte';
	import AddNewTask from '$lib/modules/hyvflow/components/tasks/board/add-new-task.svelte';

	// BoardTasks is imported lazily to avoid circular reference at module level
	// it is used in the subtask section below via a dynamic import pattern
	import BoardTasks from '$lib/modules/hyvflow/components/tasks/board/board-tasks.svelte';
	import { dragState } from '$lib/modules/hyvflow/stores/drag-state';

	let {
		task,
		taskslist,
		taskIndex,
		statusIndex,
		status,
		statusname,
		sprintIndex,
		sprintId,
		level,
		showSorting,
		draggingTask,
		taskIndexDrop = $bindable(),
		taskdropdata = $bindable(),
		isdraggingtask = $bindable(),
		isdraggingstatus = $bindable()
	}: {
		task: Task;
		taskslist: Task[];
		taskIndex: number;
		statusIndex: number;
		status: any;
		statusname: string;
		sprintIndex: number;
		sprintId: string;
		level: number;
		showSorting: boolean;
		draggingTask?: Task;
		taskIndexDrop: number;
		taskdropdata: any;
		isdraggingtask: boolean;
		isdraggingstatus: boolean;
	} = $props();

	// ---- local state ----
	let showSubtasks = $state(false);
	let showChecklist = $state(false);

	// ---- subtask collection ----
	let subtasksCollection = $derived.by(() => {
		const pid = projectManager.projectId;
		const mid = projectManager.milestoneId;
		if (!pid || !mid || !task.id) return null;
		return firekitCollection<Task>(
			`projects/${pid}/milestones/${mid}/tasks`,
			[
				where('parentId', '==', task.id),
				where('status', '!=', TaskStatus.Canceled),
				orderBy('status'),
				orderBy('position')
			]
		);
	});

	let subtasks = $derived<Task[]>(subtasksCollection?.data ?? []);

	// ---- comment info ----
	let uid = $derived(firekitUser.uid ?? '');
	let commentInfo = $derived(getLengthComments(task, uid));

	// ---- tags display ----
	const MAX_TAGS = 2;
	let visibleTags = $derived((task.tags ?? []).slice(0, MAX_TAGS));
	let extraTags = $derived((task.tags ?? []).slice(MAX_TAGS));

	// ---- drag handlers ----
	function handleDragStart(e: DragEvent) {
		e.stopPropagation(); // prevent bubbling to status column drag handler
		isdraggingtask = true;
		dragState.set({
			task,
			taskslist,
			taskIndex,
			status,
			statusIndex,
			sprintIndex,
			sprintId,
			level,
			sourceMilestoneId: projectManager.milestoneId
		});
		e.dataTransfer?.setData('text/plain', task.id);
	}

	function handleDragEnd() {
		isdraggingtask = false;
		dragState.clear();
	}

	// ---- open modal ----
	function openTask() {
		currentTaskID.set(task.id);
		openmodaltask.set(true);
	}
</script>

<div
	draggable="true"
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	role="button"
	tabindex="0"
	class="group relative cursor-grab active:cursor-grabbing {isdraggingtask ? 'opacity-40 scale-[0.97]' : ''} transition-all duration-150"
>
	<Card.Root
		class="border border-border/50 bg-card shadow-none transition-all duration-150 hover:shadow-sm hover:border-border"
	>
		<Card.Content class="p-2.5">
			<!-- Header row: name + options -->
			<div class="flex items-start justify-between gap-1">
				<!-- Task name -->
				<button
					class="flex-1 text-left"
					onclick={openTask}
					onkeydown={(e) => e.key === 'Enter' && openTask()}
				>
					<p class="line-clamp-2 text-sm font-medium leading-snug text-foreground">
						{task.name}
					</p>
				</button>

				<!-- Options dropdown -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button
								variant="ghost"
								size="icon"
								class="size-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
								{...props}
							>
								<IconDots class="size-3.5" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-40">
						<DropdownMenu.Item onclick={openTask} class="text-sm">Open task</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<!-- Due date -->
			{#if task.dueDate}
				<div class="mt-1.5">
					<TaskExpiryIndicator dataDate={task.dueDate} />
				</div>
			{/if}

			<!-- Tags -->
			{#if (task.tags?.length ?? 0) > 0}
				<div class="mt-1.5 flex flex-wrap items-center gap-1">
					{#each visibleTags as tag}
						<span
							class="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
						>
							{tag}
						</span>
					{/each}
					{#if extraTags.length > 0}
						<Tooltip.Root>
							<Tooltip.Trigger>
								<span
									class="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
								>
									+{extraTags.length}
								</span>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<div class="flex flex-col gap-0.5">
									{#each extraTags as tag}
										<span class="text-xs">{tag}</span>
									{/each}
								</div>
							</Tooltip.Content>
						</Tooltip.Root>
					{/if}
				</div>
			{/if}

			<!-- Footer -->
			<div class="mt-2 flex items-center justify-between gap-1">
				<!-- Left: priority + assignees -->
				<div class="flex items-center gap-1.5">
					{#if task.priority}
						<IconFlag flagtype={task.priority} />
					{/if}
					<TaskAssigneesView {task} iconsize="size-5" />
				</div>

				<!-- Right: subtasks, checklist, comments, files -->
				<div class="flex items-center gap-1">
					<!-- Checklist toggle -->
					{#if (task.checklist?.length ?? 0) > 0}
						<Tooltip.Root>
							<Tooltip.Trigger>
								<button
									onclick={() => (showChecklist = !showChecklist)}
									class="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
								>
									<IconChecklist class="size-3" />
									{task.checklist!.filter((c) => c.done).length}/{task.checklist!.length}
								</button>
							</Tooltip.Trigger>
							<Tooltip.Content>Toggle checklist</Tooltip.Content>
						</Tooltip.Root>
					{/if}

					<!-- Subtasks toggle -->
					{#if subtasks.length > 0}
						<Tooltip.Root>
							<Tooltip.Trigger>
								<button
									onclick={() => (showSubtasks = !showSubtasks)}
									class="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
								>
									<IconSubtask class="size-3" />
									{subtasks.length}
									{#if showSubtasks}
										<IconChevronDown class="size-2.5" />
									{:else}
										<IconChevronRight class="size-2.5" />
									{/if}
								</button>
							</Tooltip.Trigger>
							<Tooltip.Content>Toggle subtasks</Tooltip.Content>
						</Tooltip.Root>
					{/if}

					<!-- Comments -->
					{#if commentInfo.allComments > 0}
						<Tooltip.Root>
							<Tooltip.Trigger>
								<span
									class="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] {commentInfo.hasNewComments
										? 'text-primary'
										: 'text-muted-foreground'}"
								>
									<IconMessage class="size-3" />
									{commentInfo.allComments}
								</span>
							</Tooltip.Trigger>
							<Tooltip.Content>
								{commentInfo.allComments} comment{commentInfo.allComments !== 1 ? 's' : ''}
								{#if commentInfo.hasNewComments}
									· {commentInfo.unreadComments} unread
								{/if}
							</Tooltip.Content>
						</Tooltip.Root>
					{/if}

					<!-- Files -->
					{#if (task.files?.length ?? 0) > 0}
						<Tooltip.Root>
							<Tooltip.Trigger>
								<span
									class="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-muted-foreground"
								>
									<IconFile class="size-3" />
									{task.files!.length}
								</span>
							</Tooltip.Trigger>
							<Tooltip.Content>
								{task.files!.length} file{task.files!.length !== 1 ? 's' : ''}
							</Tooltip.Content>
						</Tooltip.Root>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<!-- Checklist panel (below card) -->
{#if showChecklist && (task.checklist?.length ?? 0) > 0}
	<div class="mt-1 rounded-md border border-border/50 bg-muted/30 px-2 py-1.5">
		<BoardChecklist {task} />
	</div>
{/if}

<!-- Nested subtasks -->
{#if showSubtasks && subtasks.length > 0}
	<div class="ml-3 mt-1 border-l-2 border-border/40 pl-2">
		<BoardTasks
			{statusIndex}
			{status}
			{statusname}
			tasks={subtasks}
			{sprintIndex}
			{sprintId}
			level={level + 1}
			{showSorting}
			{draggingTask}
		/>
		<div class="mt-1">
			<AddNewTask
				{status}
				taskslength={subtasks.length}
				{sprintId}
				parentId={task.id}
				typebutton="ghost"
				text="Add subtask"
			/>
		</div>
	</div>
{/if}
