<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { sideleft } from '$lib/modules/hyvflow/stores/actions/tasks-action';
	import { TaskStatus, type Task } from '$lib/modules/hyvflow/types/task';
	import { firekitCollection } from 'svelte-firekit';
	import { where } from 'firebase/firestore';
	import Input from '$lib/components/ui/input/input.svelte';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import TaskTypeDropdown from '$lib/modules/hyvflow/components/dropdown/tasks/task-type-dropdown.svelte';
	import TaskTableFormModal from './task-table-form-modal.svelte';
	import TasksChecklist from '../tasks/tasks-checklist.svelte';
	import Subtasks from '../tasks/subtasks.svelte';
	import TaskUploadFiles from './task-upload-files.svelte';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';

	let {
		membersByProject,
		taskValue,
		taskName = $bindable('')
	}: {
		membersByProject: any[];
		taskValue: Task;
		taskName: string;
	} = $props();

	let leveltasks: number = $state(0);
	let iseditname: boolean = $state(false);
	let description = $state('');
	let descSaving = $state(false);
	let descSaved = $state(false);

	const milestone = $derived(projectManager.milestoneData);

	const subtasksCollection = $derived.by(() => {
		if (!milestone?.id || !taskValue?.id || !milestone?.projectId) {
			return { data: [] };
		}
		return firekitCollection<Task>(
			`projects/${milestone.projectId}/milestones/${milestone.id}/tasks`,
			[where('parentId', '==', taskValue.id), where('status', '!=', TaskStatus.Canceled)]
		);
	});

	const subtasks = $derived(
		[...(subtasksCollection.data || [])].sort((a, b) => (a.position || 0) - (b.position || 0))
	);

	$effect(() => {
		if (taskValue?.content) {
			description =
				typeof taskValue.content === 'string'
					? taskValue.content
					: taskValue.content?.ops
						? taskValue.content.ops.map((op: any) => op.insert || '').join('')
						: '';
		} else {
			description = '';
		}
	});

	async function updatedName(event: any) {
		taskManager.updatedName(taskValue, event.target.value);
		iseditname = false;
	}

	async function saveDescription() {
		descSaving = true;
		descSaved = false;
		taskManager.setIds(projectManager.projectId, projectManager.milestoneId);
		await taskManager.updateTask({ content: description }, taskValue.id);
		descSaving = false;
		descSaved = true;
		setTimeout(() => (descSaved = false), 2000);
	}

	let descriptionTimeout: any = $state(null);

	function handleDescriptionInput() {
		descSaved = false;
		if (descriptionTimeout) clearTimeout(descriptionTimeout);
		descriptionTimeout = setTimeout(() => {
			saveDescription();
		}, 2000);
	}
</script>

<article
	class="flex flex-col py-6 {$sideleft === 'chat' || $sideleft === 'relationship' ? '' : ''}"
>
	<div
		class="mx-0 flex pl-10 md:mx-auto md:block md:p-0 {$sideleft === '' ? 'w-[70%]' : 'w-[90%]'}"
	>
		<div>
			{#if taskValue}
				<div class="mb-5 flex">
					<TaskTypeDropdown taskType={taskValue?.taskType} hasarrow={true} {taskValue} />
				</div>
				{#if iseditname}
					<Input
						onkeydown={(event) => {
							if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); updatedName(event); }
						}}
						onchange={(event) => updatedName(event)}
						bind:value={taskName}
						class="w-full"
						placeholder="Task name"
						autofocus
					/>
				{:else}
					<div class="w-full">
						<input
							class="w-full truncate border-none bg-transparent text-3xl font-semibold text-primary outline-none"
							onclick={() => (iseditname = true)}
							bind:value={taskName}
							readonly
						/>
					</div>
				{/if}
				<TaskTableFormModal {membersByProject} {taskValue} />

				<div class="flex items-center gap-2 pt-4 pl-2">
					<Label class="text-xl font-semibold">Description:</Label>
					{#if descSaving}
						<span class="flex items-center gap-1 text-xs text-muted-foreground">
							<svg class="size-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
							Saving...
						</span>
					{:else if descSaved}
						<span class="text-xs text-green-500">Saved</span>
					{/if}
				</div>
				<div class="my-2">
					<Textarea
						bind:value={description}
						oninput={handleDescriptionInput}
						placeholder="Add a description..."
						class="min-h-[200px] resize-y text-sm"
					/>
				</div>

				<br />
				<Label class="mt-10 mb-6 pl-2 text-xl font-semibold">CheckList</Label>
				<TasksChecklist {taskValue} />
				<br />

				<Label class="mt-10 mb-6 pl-2 text-xl font-semibold">Subtasks</Label>
				<Subtasks
					tasks={subtasks as Task[]}
					sprintId={taskValue.sprintId}
					status="Active"
					{leveltasks}
					currenttask={taskValue}
				/>

				<Label class="mt-10 mb-6 pl-2 text-xl font-semibold">Attachments</Label>
				<TaskUploadFiles {taskValue} files={taskValue?.files || []} />
			{:else}
				<div class="mx-auto my-auto mt-8 block h-full text-muted-foreground">Loading...</div>
			{/if}
		</div>
	</div>
</article>
