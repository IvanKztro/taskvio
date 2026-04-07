<script lang="ts">
	import IconFlag from '$lib/modules/hyvflow/components/icon-flag.svelte';
	import { taskManager } from '$lib/modules/hyvflow/stores/task-manager.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { TaskPriority, type ActivityTask } from '$lib/modules/hyvflow/types/task';
	import { Timestamp } from 'firebase/firestore';
	import { firekitUser } from 'svelte-firekit';

	let {
		priority = $bindable(),
		typefield,
		taskValue,
		variantbtn = 'outline',
		classNamebtn = 'pl-2'
	}: {
		priority: string | undefined;
		typefield: string;
		taskValue: any;
		variantbtn?: string;
		classNamebtn?: string;
	} = $props();

	const arraypriorities = [
		TaskPriority.Urgent,
		TaskPriority.High,
		TaskPriority.Normal,
		TaskPriority.Low
	];

	async function setStatusType(prior: TaskPriority) {
		if (typefield === 'field') {
			const newactivity: ActivityTask = {
				createdBy: firekitUser.uid as string,
				createdAt: Timestamp.now(),
				typeAct: 'act',
				description: `Changed Priority Task from ${priority} to ${prior}`
			};
			taskManager.addNewActivity(newactivity, taskValue, { updated: { priority: prior } });
		}
		priority = prior;
	}
</script>

{#if typefield === 'icon'}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="flex items-center gap-2 rounded-md px-1 text-xs font-medium">
			<Button
				variant="outline"
				size="sm"
				class="h-6 w-auto px-1 {priority ? 'flex gap-1 px-2' : ''}"
			>
				<IconFlag className="w-3.5 h-4" flagtype={priority} hastext={false} />
				<small>{priority}</small>
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="z-[70] w-56">
			{#each arraypriorities as priori}
				<DropdownMenu.Item
					onclick={() => setStatusType(priori)}
					class={priori === priority ? 'bg-primary text-white' : ''}
				>
					<div class="flex items-center justify-start gap-2 rounded-md px-3 py-1">
						<IconFlag flagtype={priori} hastext={false} />
						<h1 class="text-xs font-medium">{priori}</h1>
					</div>
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else if typefield === 'field'}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="flex w-full gap-2 rounded-md text-xs font-medium">
			<Button variant={variantbtn} size="icon" class="-px-8 flex w-full justify-start {classNamebtn}">
				<IconFlag className="w-3.5 h-4" flagtype={priority} hastext={false} />
				<p class="pl-2">{priority || 'Set priority'}</p>
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="z-[70] w-80 border border-primary/70 bg-background p-2">
			{#each arraypriorities as priori}
				<DropdownMenu.Item
					onclick={() => setStatusType(priori)}
					class={priori === priority ? 'bg-primary text-white' : ''}
				>
					<div class="flex items-center justify-start gap-2 rounded-md px-3 py-1">
						<IconFlag flagtype={priori} hastext={false} />
						<h1 class="text-xs font-medium">{priori}</h1>
					</div>
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="flex w-full gap-2 rounded-md text-xs font-medium">
			<Button variant="ghost" size="icon" class="-px-8 flex w-full justify-start pl-2">
				<p class="pl-2 text-sm">{priority === '' ? 'Add priority' : priority}</p>
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="z-[70] w-56">
			{#each arraypriorities as priori}
				<DropdownMenu.Item
					onclick={() => setStatusType(priori)}
					class={priori === priority ? 'bg-primary text-white' : ''}
				>
					<div class="flex items-center justify-start gap-2 rounded-md px-3 py-1">
						<IconFlag flagtype={priori} hastext={false} />
						<h1 class="text-xs font-medium">{priori}</h1>
					</div>
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
