<script lang="ts">
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import Tasks from '$lib/modules/hyvflow/components/tasks/tasks.svelte';
	import TaskModal from '$lib/modules/hyvflow/components/modal-task/task-modal.svelte';
	import { currentTaskID, openmodaltask } from '$lib/modules/hyvflow/stores/firestore-batch/batch';

	let tasks = $derived(projectManager.tasks);
	let members = $derived(projectManager.projectMembers);

	let currentTask = $derived(
		$openmodaltask && $currentTaskID
			? (tasks.find((t: any) => t.id === $currentTaskID) ?? null)
			: null
	);
</script>

<Tasks />

<TaskModal {currentTask} membersByProject={members} />
