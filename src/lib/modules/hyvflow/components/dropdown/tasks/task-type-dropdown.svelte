<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { TaskType, type ActivityTask } from '$lib/modules/hyvflow/types/task';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Timestamp } from 'firebase/firestore';
	import { firekitUser } from 'svelte-firekit';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import { IconSquare, IconBox, IconCircle, IconChevronDown } from '@tabler/icons-svelte';

	let {
		taskType = $bindable(),
		hasarrow,
		taskValue
	}: {
		taskType: string;
		hasarrow: boolean;
		taskValue: any;
	} = $props();

	let wascopyID: boolean = $state(false);

	async function setStatusType(typeT: TaskType) {
		if (hasarrow) {
			const newactivity: ActivityTask = {
				createdBy: firekitUser?.uid as string,
				createdAt: Timestamp.now(),
				typeAct: 'act',
				description: `Updated Task Type: ${typeT}`
			};
			taskManager.addNewActivity(newactivity, taskValue, { updated: { taskType: typeT } });
		}
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(taskValue?.id);
			wascopyID = true;
			setTimeout(() => {
				wascopyID = false;
			}, 3000);
		} catch (err) {
			console.error('Error copying to clipboard:', err);
		}
	}
</script>

<DropdownMenu.Root>
	<section class="flex">
		<div
			class="flex items-center gap-1 {hasarrow
				? 'rounded-l-md border-2 border-border p-1 hover:bg-foreground/10'
				: ''}"
		>
			<DropdownMenu.Trigger
				class="flex items-center gap-2 {taskType !== '' && !hasarrow
					? 'hover:bg-foreground/10'
					: ''} rounded-md px-1 text-xs font-medium"
			>
				{#if taskType === TaskType.Task}
					<IconCircle class="size-4" />
					Task
				{:else if taskType === TaskType.Milestone}
					<IconSquare class="size-4" />
					Milestone
				{:else}
					<Button variant="outline" size="sm" class="h-6 w-6">
						<IconBox class="size-3.5" />
					</Button>
				{/if}
				{#if hasarrow}
					<IconChevronDown class="size-4" />
				{/if}
			</DropdownMenu.Trigger>
		</div>
		{#if hasarrow}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant="ghost"
						onclick={copyToClipboard}
						class="flex items-center gap-1 {hasarrow
							? 'rounded-l-none rounded-r-md border-2 border-l-0 border-border p-1 hover:bg-foreground/10'
							: ''}"
					>
						<small>{wascopyID ? 'Copied!' : taskValue?.id}</small>
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Copy ID</p>
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
	</section>

	<DropdownMenu.Content class="z-[70] w-56">
		<DropdownMenu.Label class="text-xs text-muted-foreground">Create</DropdownMenu.Label>
		<DropdownMenu.Item
			onclick={() => setStatusType(TaskType.Task)}
			class={TaskType.Task === taskType ? 'bg-primary/50' : ''}
		>
			<div class="flex items-center justify-start gap-2 rounded-md px-3 py-1">
				<IconCircle class="size-3" />
				<h1 class="text-xs font-medium">Task</h1>
			</div>
		</DropdownMenu.Item>
		<DropdownMenu.Item
			onclick={() => setStatusType(TaskType.Milestone)}
			class={TaskType.Milestone === taskType ? 'bg-primary/50' : ''}
		>
			<div class="flex items-center justify-start gap-2 rounded-md px-3 py-1">
				<IconSquare class="size-3" />
				<h1 class="text-xs font-medium">Milestone</h1>
			</div>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
