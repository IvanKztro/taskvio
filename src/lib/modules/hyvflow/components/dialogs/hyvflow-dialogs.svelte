<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';

	// Action stores
	import {
		isopenproject,
		isopendeleteproject,
		projectActions,
		deleteProject
	} from '$lib/modules/hyvflow/stores/actions/project-action';
	import {
		isopenmilestone,
		isopendeletemilestone,
		milestoneActions,
		deleteMilestone
	} from '$lib/modules/hyvflow/stores/actions/milestone-actions';
	import {
		isopensprint,
		isopendeletesprint,
		sprintActions,
		deleteSprint
	} from '$lib/modules/hyvflow/stores/actions/sprint-action';
	import {
		isopenstatus,
		statusActions
	} from '$lib/modules/hyvflow/stores/actions/status-action';
	import {
		isopendeletetask,
		tasktodelete,
		milestoneInfo
	} from '$lib/modules/hyvflow/stores/actions/tasks-action';

	// Forms
	import ProjectForm from '$lib/modules/hyvflow/components/forms/project-form.svelte';
	import MilestoneForm from '$lib/modules/hyvflow/components/forms/milestone-form.svelte';
	import SprintForm from '$lib/modules/hyvflow/components/forms/sprint-form.svelte';
	import StatusForm from '$lib/modules/hyvflow/components/forms/status-form.svelte';

	// Delete task handler
	async function handleDeleteTask() {
		const task = $tasktodelete;
		const milestone = $milestoneInfo;
		if (!task || !milestone) return;
		taskManager.setIds(projectManager.projectId, projectManager.milestoneId);
		await taskManager.deleteTask(task, milestone);
	}
</script>

<!-- 1. Project Form Dialog -->
<Dialog.Root
	open={$isopenproject}
	onOpenChange={(val) => {
		if (!val) {
			isopenproject.set(false);
			projectActions.set(undefined);
		}
	}}
>
	<Dialog.Content class="max-w-2xl min-w-2xl">
		<Dialog.Header>
			<Dialog.Title>{$projectActions ? 'Edit Project' : 'Create Project'}</Dialog.Title>
		</Dialog.Header>
		<ProjectForm />
	</Dialog.Content>
</Dialog.Root>

<!-- 2. Milestone Form Dialog -->
<Dialog.Root
	open={$isopenmilestone}
	onOpenChange={(val) => {
		if (!val) {
			isopenmilestone.set(false);
			milestoneActions.set(undefined);
		}
	}}
>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{$milestoneActions ? 'Edit Milestone' : 'Create Milestone'}</Dialog.Title>
		</Dialog.Header>
		<MilestoneForm />
	</Dialog.Content>
</Dialog.Root>

<!-- 3. Sprint Form Dialog -->
<Dialog.Root
	open={$isopensprint}
	onOpenChange={(val) => {
		if (!val) {
			isopensprint.set(false);
			sprintActions.set(undefined);
		}
	}}
>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{$sprintActions ? 'Edit Sprint' : 'Create Sprint'}</Dialog.Title>
		</Dialog.Header>
		<SprintForm />
	</Dialog.Content>
</Dialog.Root>

<!-- 4. Status Form Dialog -->
<Dialog.Root
	open={$isopenstatus}
	onOpenChange={(val) => {
		if (!val) {
			isopenstatus.set(false);
			statusActions.set(undefined);
		}
	}}
>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>{$statusActions ? 'Edit Status' : 'Create Status'}</Dialog.Title>
		</Dialog.Header>
		<StatusForm />
	</Dialog.Content>
</Dialog.Root>

<!-- 5. Delete Project Confirm -->
<AlertDialog.Root
	open={$isopendeleteproject}
	onOpenChange={(val) => {
		if (!val) isopendeleteproject.set(false);
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Project</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete <strong>{$projectActions?.name}</strong>? This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => isopendeleteproject.set(false)}>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={deleteProject}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- 6. Delete Milestone Confirm -->
<AlertDialog.Root
	open={$isopendeletemilestone}
	onOpenChange={(val) => {
		if (!val) isopendeletemilestone.set(false);
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Milestone</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete <strong>{$milestoneActions?.name}</strong>? This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => isopendeletemilestone.set(false)}>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={deleteMilestone}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- 7. Delete Sprint Confirm -->
<AlertDialog.Root
	open={$isopendeletesprint}
	onOpenChange={(val) => {
		if (!val) isopendeletesprint.set(false);
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Sprint</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete <strong>{$sprintActions?.name}</strong>? All tasks in this sprint will be archived.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => isopendeletesprint.set(false)}>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={deleteSprint}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- 8. Delete Task Confirm -->
<AlertDialog.Root
	open={$isopendeletetask}
	onOpenChange={(val) => {
		if (!val) isopendeletetask.set(false);
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Task</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete <strong>{$tasktodelete?.name}</strong>? This will also delete all subtasks.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => isopendeletetask.set(false)}>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={handleDeleteTask}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
