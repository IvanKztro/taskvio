<script lang="ts">
	import { currentTaskID, openmodaltask } from '$lib/modules/hyvflow/stores/firestore-batch/batch';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { IconChevronRight } from '@tabler/icons-svelte';

	const project = $derived(projectManager.projectData);
	const milestone = $derived(projectManager.milestoneData);

	function handleClick() {
		openmodaltask.set(false);
		currentTaskID.set('');
	}
</script>

{#if project && milestone}
	<nav class="flex items-center gap-1 text-xs text-muted-foreground">
		<a
			href="/p/{project.id}"
			onclick={handleClick}
			class="max-w-[150px] truncate hover:text-foreground md:max-w-[250px]"
		>
			{project.name}
		</a>
		<IconChevronRight class="size-3 shrink-0" />
		<a
			href="/p/{project.id}/m/{milestone.id}"
			onclick={handleClick}
			class="max-w-[150px] truncate hover:text-foreground md:max-w-[250px]"
		>
			{milestone.name}
		</a>
	</nav>
{/if}
