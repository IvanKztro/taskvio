<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { IconPlus, IconEdit, IconFlag, IconCalendar } from '@tabler/icons-svelte';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import {
		isopenmilestone,
		milestoneActions,
		projectIdStore
	} from '$lib/modules/hyvflow/stores/actions/milestone-actions';
	import {
		isopenproject,
		projectActions
	} from '$lib/modules/hyvflow/stores/actions/project-action';
	import { goto } from '$app/navigation';

	let milestones = $derived(projectManager.milestones);
	let project = $derived(projectManager.projectData);

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
			Complete: 'bg-emerald-100 text-emerald-700',
			Archived: 'bg-gray-100 text-gray-500'
		};
		return map[status] ?? 'bg-muted text-muted-foreground';
	}

	function priorityColor(priority?: string): string {
		const map: Record<string, string> = {
			Urgent: 'text-red-500',
			High: 'text-orange-500',
			Normal: 'text-blue-500',
			Low: 'text-gray-400'
		};
		return priority ? (map[priority] ?? 'text-muted-foreground') : 'text-muted-foreground';
	}

	function handleNewMilestone() {
		if (!project) return;
		milestoneActions.set(undefined);
		projectIdStore.set(project.id);
		isopenmilestone.set(true);
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<div class="flex items-center gap-3 border-b border-border px-6 py-4">
		<h1 class="flex-1 text-xl font-semibold ml-6">
			{project?.name ?? 'Milestones'}
		</h1>

		<!-- Edit project -->
		{#if project}
			<Button
				variant="ghost"
				size="icon"
				class="size-8"
				onclick={() => {
					import('$lib/modules/hyvflow/stores/actions/project-action').then(({ projectActions }) => {
						projectActions.set(project);
						isopenproject.set(true);
					});
				}}
				title="Edit project"
			>
				<IconEdit class="size-4" />
			</Button>
		{/if}

		<Button onclick={handleNewMilestone} class="gap-2">
			<IconPlus class="size-4" />
			New Milestone
		</Button>
	</div>

	<!-- Milestones list -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if milestones.length === 0}
			<div class="flex flex-col items-center justify-center gap-4 py-16 text-center">
				<p class="text-base font-medium">No milestones yet</p>
				<p class="text-sm text-muted-foreground">Create a milestone to start planning your project.</p>
				<Button onclick={handleNewMilestone} class="gap-2">
					<IconPlus class="size-4" />
					New Milestone
				</Button>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each milestones as milestone (milestone.id)}
					<button
						onclick={() => goto('/p/' + project?.id + '/m/' + milestone.id)}
						class="w-full text-left"
					>
						<Card.Root class="cursor-pointer border border-border/50 transition-shadow hover:shadow-sm">
							<Card.Content class="p-4">
								<div class="flex items-start justify-between gap-3">
									<!-- Left -->
									<div class="flex-1">
										<div class="mb-1 flex items-center gap-2">
											<h3 class="font-semibold">{milestone.name}</h3>
											<span class="rounded-full px-2 py-0.5 text-[11px] font-medium {statusColor(milestone.status)}">
												{milestone.status}
											</span>
											{#if milestone.priority}
												<span class="text-[11px] font-medium {priorityColor(milestone.priority)}">
													{milestone.priority}
												</span>
											{/if}
										</div>

										{#if milestone.description}
											<p class="line-clamp-1 text-sm text-muted-foreground">{milestone.description}</p>
										{/if}
									</div>

									<!-- Right: sprint count + dates -->
									<div class="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
										{#if (milestone.arraySprints?.length ?? 0) > 0}
											<span>{milestone.arraySprints!.length} sprint{milestone.arraySprints!.length !== 1 ? 's' : ''}</span>
										{/if}
										<div class="flex items-center gap-1">
											<IconCalendar class="size-3" />
											{#if milestone.startDate}
												<span>{formatDate(milestone.startDate)}</span>
											{/if}
											{#if milestone.dueDate}
												<span>→ {formatDate(milestone.dueDate)}</span>
											{/if}
										</div>
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
