<script lang="ts">
	import { userInterfacesManager } from '$lib/modules/hyvflow/stores/user-interfaces-manager.svelte';
	import Kanban from '$lib/modules/hyvflow/components/tasks/board/kanban.svelte';

	let { currentTab = 'kanban' }: { currentTab?: string } = $props();

	// Persist subTab as 'kanban'
	$effect(() => {
		userInterfacesManager.updateUserInterfaceState('subTab', 'kanban');
	});
</script>

<div class="flex h-full flex-col ml-7">
	<Kanban {currentTab} />
</div>
