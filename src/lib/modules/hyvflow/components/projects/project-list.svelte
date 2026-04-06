<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { IconPlus, IconUsers, IconLayoutKanban } from '@tabler/icons-svelte';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { isopenproject } from '$lib/modules/hyvflow/stores/actions/project-action';
	import { goto } from '$app/navigation';
	import type { Project } from '$lib/modules/hyvflow/types/project';

	let projects = $derived(projectManager.projects);

	function formatDate(ts: any): string {
		if (!ts?.seconds) return '';
		return new Date(ts.seconds * 1000).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function statusColor(status: string): string {
		const map: Record<string, string> = {
			Active: 'bg-green-100 text-green-700',
			InProgress: 'bg-blue-100 text-blue-700',
			InReview: 'bg-yellow-100 text-yellow-700',
			Paused: 'bg-orange-100 text-orange-700',
			Archived: 'bg-gray-100 text-gray-600',
			Complete: 'bg-emerald-100 text-emerald-700',
			Hidden: 'bg-gray-100 text-gray-500'
		};
		return map[status] ?? 'bg-muted text-muted-foreground';
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-border px-6 py-4">
		<h1 class="text-xl font-semibold">Projects</h1>
		<Button onclick={() => isopenproject.set(true)} class="gap-2">
			<IconPlus class="size-4" />
			New Project
		</Button>
	</div>

	<!-- Projects grid -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if projects.length === 0}
			<div class="flex flex-col items-center justify-center gap-4 py-16 text-center">
				<div class="flex size-16 items-center justify-center rounded-full bg-muted">
					<IconLayoutKanban class="size-8 text-muted-foreground" />
				</div>
				<p class="text-base font-medium">No projects yet</p>
				<p class="text-sm text-muted-foreground">Create your first project to get started.</p>
				<Button onclick={() => isopenproject.set(true)} class="gap-2">
					<IconPlus class="size-4" />
					New Project
				</Button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each projects as project (project.id)}
					<button
						onclick={() => goto('/p/' + project.id)}
						class="text-left"
					>
						<Card.Root class="h-full cursor-pointer border border-border/50 transition-shadow hover:shadow-md">
							<Card.Content class="p-4">
								<!-- Header row -->
								<div class="mb-2 flex items-start justify-between gap-2">
									<h3 class="line-clamp-1 font-semibold">{project.name}</h3>
									<span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium {statusColor(project.status)}">
										{project.status}
									</span>
								</div>

								<!-- Description preview -->
								{#if project.description}
									<p class="mb-3 line-clamp-2 text-sm text-muted-foreground">
										{project.description}
									</p>
								{/if}

								<!-- Dates -->
								<div class="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
									{#if project.startDate}
										<span>Start: {formatDate(project.startDate)}</span>
									{/if}
									{#if project.dueDate}
										<span>Due: {formatDate(project.dueDate)}</span>
									{/if}
								</div>

								<!-- Footer: member count -->
								{#if (project.members?.length ?? 0) > 0}
									<div class="flex items-center gap-1 text-xs text-muted-foreground">
										<IconUsers class="size-3.5" />
										{project.members!.length} member{project.members!.length !== 1 ? 's' : ''}
									</div>
								{/if}
							</Card.Content>
						</Card.Root>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
