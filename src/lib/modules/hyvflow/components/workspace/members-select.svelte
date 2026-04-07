<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Popover from '$lib/components/ui/popover';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { getInitials } from '$lib/utils';
	import { IconUserPlus, IconX } from '@tabler/icons-svelte';

	let {
		value = $bindable([]),
		users = [],
		typecomp = 'task',
		updatedField = false,
		updatedClick = () => {}
	}: {
		value: string[];
		users: any[];
		typecomp?: string;
		updatedField?: boolean;
		updatedClick?: (value: any, user: any, typeaction: string) => void;
	} = $props();

	let open = $state(false);
	let search = $state('');

	const filteredUsers = $derived.by(() => {
		if (!search) return users;
		const q = search.toLowerCase();
		return users.filter(
			(u: any) =>
				u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
		);
	});

	const selectedUsers = $derived(
		users.filter((u: any) => value?.includes(u.uid || u.id))
	);

	function isSelected(user: any): boolean {
		return value?.includes(user.uid || user.id);
	}

	function toggleUser(user: any) {
		const uid = user.uid || user.id;
		let newValue: string[];

		if (isSelected(user)) {
			newValue = value.filter((v: string) => v !== uid);
			if (updatedField) updatedClick(newValue, user, 'removed');
		} else {
			newValue = [...(value || []), uid];
			if (updatedField) updatedClick(newValue, user, 'assigned');
		}

		value = newValue;
	}

	function removeUser(user: any) {
		const uid = user.uid || user.id;
		const newValue = value.filter((v: string) => v !== uid);
		if (updatedField) updatedClick(newValue, user, 'removed');
		value = newValue;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger class="w-full">
		<Button variant="outline" class="flex w-full items-center justify-start gap-2 text-left">
			{#if selectedUsers.length > 0}
				<div class="flex -space-x-2">
					{#each selectedUsers.slice(0, 4) as user}
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Avatar.Root class="size-6 border-2 border-background">
									{#if user.photoURL}
										<Avatar.Image src={user.photoURL} alt={user.displayName} />
									{/if}
									<Avatar.Fallback class="text-[10px]">
										{getInitials(user.displayName)}
									</Avatar.Fallback>
								</Avatar.Root>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p class="text-xs">{user.displayName}</p>
							</Tooltip.Content>
						</Tooltip.Root>
					{/each}
					{#if selectedUsers.length > 4}
						<div class="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px]">
							+{selectedUsers.length - 4}
						</div>
					{/if}
				</div>
			{:else}
				<IconUserPlus class="size-4 text-muted-foreground" />
				<span class="text-xs text-muted-foreground">Assign members</span>
			{/if}
		</Button>
	</Popover.Trigger>
	<Popover.Content class="z-[70] w-72 p-3">
		<Input
			bind:value={search}
			placeholder="Search members..."
			class="mb-3 h-8 text-sm"
		/>

		{#if selectedUsers.length > 0}
			<div class="mb-2 flex flex-wrap gap-1">
				{#each selectedUsers as user}
					<div class="flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5">
						<Avatar.Root class="size-4">
							{#if user.photoURL}
								<Avatar.Image src={user.photoURL} alt={user.displayName} />
							{/if}
							<Avatar.Fallback class="text-[8px]">
								{getInitials(user.displayName)}
							</Avatar.Fallback>
						</Avatar.Root>
						<span class="text-xs">{user.displayName?.split(' ')[0]}</span>
						<button onclick={() => removeUser(user)} class="cursor-pointer">
							<IconX class="size-3 text-muted-foreground hover:text-foreground" />
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<div class="max-h-48 space-y-1 overflow-y-auto">
			{#each filteredUsers as user}
				<button
					class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50 {isSelected(user) ? 'bg-primary/10' : ''}"
					onclick={() => toggleUser(user)}
				>
					<Avatar.Root class="size-7">
						{#if user.photoURL}
							<Avatar.Image src={user.photoURL} alt={user.displayName} />
						{/if}
						<Avatar.Fallback class="text-[10px]">
							{getInitials(user.displayName)}
						</Avatar.Fallback>
					</Avatar.Root>
					<div class="flex-1 overflow-hidden">
						<p class="truncate text-sm">{user.displayName}</p>
						<p class="truncate text-xs text-muted-foreground">{user.email}</p>
					</div>
					{#if isSelected(user)}
						<div class="size-2 rounded-full bg-primary"></div>
					{/if}
				</button>
			{/each}
			{#if filteredUsers.length === 0}
				<p class="py-2 text-center text-xs text-muted-foreground">No members found</p>
			{/if}
		</div>
	</Popover.Content>
</Popover.Root>
