<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { ActivityTask, Task, TaskChecklist } from '$lib/modules/hyvflow/types/task';
	import { Timestamp } from 'firebase/firestore';
	import { firekitUser } from 'svelte-firekit';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import {
		IconCircle,
		IconCircleCheck,
		IconPlus,
		IconDots,
		IconTrash,
		IconEdit
	} from '@tabler/icons-svelte';

	let { taskValue }: { taskValue: Task } = $props();

	let newItemName = $state('');
	let editingIndex = $state<number | null>(null);
	let editingName = $state('');

	let checklist = $derived<TaskChecklist[]>(taskValue?.checklist || []);
	let doneCount = $derived(checklist.filter((item) => item.done).length);

	async function addItem() {
		if (!newItemName.trim()) return;

		const newItem: TaskChecklist = {
			createdAt: Timestamp.now(),
			createdBy: firekitUser?.uid as string,
			name: newItemName.trim(),
			done: false
		};

		const updatedChecklist = [...checklist, newItem];
		newItemName = '';

		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Added checklist item: ${newItem.name}`
		};
		taskManager.addNewActivity(newactivity, taskValue, {
			updated: { checklist: updatedChecklist }
		});
	}

	async function toggleItem(index: number) {
		const updatedChecklist = [...checklist];
		updatedChecklist[index] = { ...updatedChecklist[index], done: !updatedChecklist[index].done };

		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `${updatedChecklist[index].done ? 'Completed' : 'Uncompleted'} checklist item: ${updatedChecklist[index].name}`
		};
		taskManager.addNewActivity(newactivity, taskValue, {
			updated: { checklist: updatedChecklist }
		});
	}

	async function deleteItem(index: number) {
		const itemName = checklist[index].name;
		const updatedChecklist = checklist.filter((_, i) => i !== index);

		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Removed checklist item: ${itemName}`
		};
		taskManager.addNewActivity(newactivity, taskValue, {
			updated: { checklist: updatedChecklist }
		});
	}

	function startRename(index: number) {
		editingIndex = index;
		editingName = checklist[index].name;
	}

	async function saveRename(index: number) {
		if (!editingName.trim()) {
			editingIndex = null;
			return;
		}

		const updatedChecklist = [...checklist];
		updatedChecklist[index] = { ...updatedChecklist[index], name: editingName.trim() };
		editingIndex = null;

		const newactivity: ActivityTask = {
			createdBy: firekitUser?.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Renamed checklist item to: ${editingName.trim()}`
		};
		taskManager.addNewActivity(newactivity, taskValue, {
			updated: { checklist: updatedChecklist }
		});
	}
</script>

<div class="space-y-2">
	{#if checklist.length > 0}
		<div class="mb-2 text-xs text-muted-foreground">
			{doneCount}/{checklist.length} completed
		</div>
	{/if}

	{#each checklist as item, i}
		<div class="group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50">
			<button onclick={() => toggleItem(i)} class="shrink-0 cursor-pointer">
				{#if item.done}
					<IconCircleCheck class="size-5 text-green-500" />
				{:else}
					<IconCircle class="size-5 text-muted-foreground" />
				{/if}
			</button>

			{#if editingIndex === i}
				<Input
					bind:value={editingName}
					class="h-7 flex-1 text-sm"
					onkeydown={(e) => {
						if (e.key === 'Enter') saveRename(i);
						if (e.key === 'Escape') (editingIndex = null);
					}}
					autofocus
				/>
			{:else}
				<span class="flex-1 text-sm {item.done ? 'text-muted-foreground line-through' : ''}">
					{item.name}
				</span>
			{/if}

			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="opacity-0 group-hover:opacity-100">
					<IconDots class="size-4 text-muted-foreground" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="z-[70] w-40">
					<DropdownMenu.Item onclick={() => startRename(i)}>
						<IconEdit class="mr-2 size-4" /> Rename
					</DropdownMenu.Item>
					<DropdownMenu.Item class="text-destructive" onclick={() => deleteItem(i)}>
						<IconTrash class="mr-2 size-4" /> Delete
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	{/each}

	<div class="flex items-center gap-2">
		<Input
			bind:value={newItemName}
			placeholder="Add an item..."
			class="h-8 flex-1 text-sm"
			onkeydown={(e) => {
				if (e.key === 'Enter') addItem();
			}}
		/>
		<Button variant="ghost" size="sm" class="h-8 gap-1" onclick={addItem}>
			<IconPlus class="size-4" /> Add
		</Button>
	</div>
</div>
