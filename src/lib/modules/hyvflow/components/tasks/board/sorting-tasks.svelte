<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import IconSquareChevronDown from '@tabler/icons-svelte/icons/square-chevron-down';
	import { userInterfacesManager } from '$lib/modules/hyvflow/stores/user-interfaces-manager.svelte';

	let {
		showSorting = $bindable(),
		status,
		sprintId
	}: {
		showSorting: boolean;
		status: any;
		sprintId: string;
	} = $props();

	const sortOptions = [
		{ label: 'Assignees', value: 'assignees' },
		{ label: 'Custom (position)', value: 'position' },
		{ label: 'Date Created', value: 'createdAt' },
		{ label: 'Date Updated', value: 'updatedAt' },
		{ label: 'Due Date', value: 'dueDate' },
		{ label: 'Priority', value: 'priority' },
		{ label: 'Tags', value: 'tags' },
		{ label: 'Titles', value: 'name' }
	];

	let currentSort = $derived(
		userInterfacesManager.userInterfaces?.[`sort_${sprintId}_${status?.status}`] ?? 'position'
	);

	async function selectSort(value: string) {
		const key = `sort_${sprintId}_${status?.status}`;
		await userInterfacesManager.updateUserInterfaceState(key, value);
		showSorting = false;
	}
</script>

<DropdownMenu.Root bind:open={showSorting}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button variant="ghost" size="sm" class="h-7 gap-1 px-2 text-xs" {...props}>
				<IconSquareChevronDown class="size-4" />
				Sort
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start" class="w-48">
		<DropdownMenu.Label class="text-xs text-muted-foreground">Sort by</DropdownMenu.Label>
		<DropdownMenu.Separator />
		{#each sortOptions as option}
			<DropdownMenu.Item
				class="text-sm"
				onclick={() => selectSort(option.value)}
			>
				<span class="flex w-full items-center justify-between">
					{option.label}
					{#if currentSort === option.value}
						<span class="size-1.5 rounded-full bg-primary"></span>
					{/if}
				</span>
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
