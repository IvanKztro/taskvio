<script lang="ts">
	import { page } from '$app/stores';
	import { AuthGuard } from 'svelte-firekit';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import AppSidebar from '$lib/modules/hyvflow/components/sidebar/app-sidebar.svelte';
	import HyvflowDialogs from '$lib/modules/hyvflow/components/dialogs/hyvflow-dialogs.svelte';

	let { children } = $props();

	$effect(() => {
		const params = $page.params;
		if (params.projectId) projectManager.projectId = params.projectId;
		if (params.milestoneId) projectManager.milestoneId = params.milestoneId;
	});
</script>

<AuthGuard redirectTo="/sign-in" requireAuth={true}>
	<div class="flex h-screen w-full overflow-hidden">
		<AppSidebar />
		<main class="flex flex-1 flex-col overflow-hidden">
			{@render children()}
		</main>
	</div>
	<HyvflowDialogs />
</AuthGuard>
