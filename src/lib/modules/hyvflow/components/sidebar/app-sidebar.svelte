<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import {
		IconPlus,
		IconChevronDown,
		IconChevronRight,
		IconLayoutKanban,
		IconFlag3,
		IconLayoutSidebarLeftCollapse,
		IconLayoutSidebarLeftExpand,
		IconDotsVertical,
		IconEdit,
		IconLink,
		IconTrash
	} from '@tabler/icons-svelte';
	import { firekitCollection } from 'svelte-firekit';
	import { where } from 'firebase/firestore';
	import { MilestoneStatus, type Milestone } from '$lib/modules/hyvflow/types/milestone';
	import type { Project } from '$lib/modules/hyvflow/types/project';
	import { projectManager } from '$lib/modules/hyvflow/stores/project-manager.svelte';
	import { sidebarSessionManager } from '$lib/modules/hyvflow/stores/sidebar-session-manager.svelte';
	import { sidebarOpen } from '$lib/modules/hyvflow/stores/hyvflow-general';
	import { isopenproject, projectActions, isopendeleteproject } from '$lib/modules/hyvflow/stores/actions/project-action';
	import {
		isopenmilestone,
		milestoneActions,
		projectIdStore
	} from '$lib/modules/hyvflow/stores/actions/milestone-actions';
	import {
		isopensprint,
		sprintActions,
		sprintsActions
	} from '$lib/modules/hyvflow/stores/actions/sprint-action';
	import { page } from '$app/stores';
	import { goto, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let projects = $derived(projectManager.projects);
	let currentProjectId = $derived(projectManager.projectId);
	let currentMilestoneId = $derived(projectManager.milestoneId);

	// Cache of milestone collections per projectId (lazy loaded on expand)
	let milestonesCache = $state<Record<string, Milestone[]>>({});

	onMount(() => {
		sidebarSessionManager.initialize();
		sidebarSessionManager.syncWithPath($page.url.pathname);
	});

	afterNavigate(({ to }) => {
		if (to?.url) sidebarSessionManager.syncWithPath(to.url.pathname);
	});

	function toggleProject(projectId: string) {
		const isOpen = sidebarSessionManager.isProjectOpen(projectId);
		sidebarSessionManager.toggleProject(projectId, !isOpen);
	}

	// Returns milestones for any project — uses active-project data if available, else cached/fetched
	function getMilestones(projectId: string): Milestone[] {
		if (projectId === currentProjectId) {
			return projectManager.milestones;
		}
		return milestonesCache[projectId] ?? [];
	}

	// When a project is opened that's NOT the active one, load its milestones once
	$effect(() => {
		for (const project of projects) {
			if (
				project.id !== currentProjectId &&
				sidebarSessionManager.isProjectOpen(project.id) &&
				!milestonesCache[project.id]
			) {
				const col = firekitCollection<Milestone>(`projects/${project.id}/milestones`, [
					where('status', '!=', MilestoneStatus.Canceled)
				]);
				// Subscribe reactively
				$effect(() => {
					if (col.data) {
						milestonesCache = { ...milestonesCache, [project.id]: col.data };
					}
				});
			}
		}
	});

	// ---- Project actions ----
	function handleEditProject(project: Project) {
		projectActions.set(project);
		isopenproject.set(true);
	}

	function handleCopyProjectLink(project: Project) {
		navigator.clipboard.writeText(`${$page.url.origin}/p/${project.id}`);
		toast.success('Link copied');
	}

	function handleDeleteProject(project: Project) {
		projectActions.set(project);
		isopendeleteproject.set(true);
	}

	function handleAddMilestone(project: Project) {
		milestoneActions.set(undefined);
		projectIdStore.set(project.id);
		isopenmilestone.set(true);
	}

	// ---- Milestone actions ----
	function handleEditMilestone(milestone: Milestone) {
		milestoneActions.set(milestone);
		projectIdStore.set(milestone.projectId);
		isopenmilestone.set(true);
	}

	function handleCopyMilestoneLink(projectId: string, milestoneId: string) {
		navigator.clipboard.writeText(`${$page.url.origin}/p/${projectId}/m/${milestoneId}`);
		toast.success('Link copied');
	}

	function handleAddSprint(milestone: Milestone) {
		milestoneActions.set(milestone);
		sprintActions.set(undefined);
		sprintsActions.set(milestone.arraySprints ?? []);
		isopensprint.set(true);
	}
</script>

<aside
	class="flex h-full flex-col border-r border-border bg-sidebar transition-all duration-200 {$sidebarOpen
		? 'w-70'
		: 'w-0 overflow-hidden'}"
>
	{#if $sidebarOpen}
		<!-- Header -->
		<div class="flex items-center gap-2 border-b border-border px-4 py-3">
			<div class="flex size-7 items-center justify-center rounded-md bg-primary">
				<IconLayoutKanban class="size-4 text-primary-foreground" />
			</div>
			<span class="text-sm font-bold">TaskIO</span>
		</div>

		<!-- New Project -->
		<div class="px-3 py-2">
			<Button
				variant="outline"
				size="sm"
				class="w-full justify-start gap-2 text-xs"
				onclick={() => { projectActions.set(undefined); isopenproject.set(true); }}
			>
				<IconPlus class="size-3.5" />
				New Project
			</Button>
		</div>

		<!-- Projects list -->
		<nav class="flex-1 overflow-y-auto px-2 py-1">
			{#each projects as project (project.id)}
				{@const isProjectOpen = sidebarSessionManager.isProjectOpen(project.id)}
				{@const projectMilestones = getMilestones(project.id)}
				{@const isActiveProject = project.id === currentProjectId}

				<div class="mb-0.5">
					<!-- Project row -->
					<div class="group flex items-center rounded-md hover:bg-muted/50 {isActiveProject ? 'bg-muted/30' : ''}">
						<!-- Toggle arrow -->
						<button
							class="flex size-7 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
							onclick={() => toggleProject(project.id)}
						>
							{#if isProjectOpen}
								<IconChevronDown class="size-3.5" />
							{:else}
								<IconChevronRight class="size-3.5" />
							{/if}
						</button>

						<!-- Project name -->
						<button
							class="flex flex-1 items-center gap-1.5 py-1.5 text-left text-sm font-medium"
							onclick={() => goto('/p/' + project.id)}
						>
							<span
								class="size-2 shrink-0 rounded-full"
								style="background-color: {project.color || '#6366f1'};"
							></span>
							<span class="flex-1 truncate">{project.name}</span>
						</button>

						<!-- Options menu (visible on hover) -->
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<button
										{...props}
										class="mr-1 flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
									>
										<IconDotsVertical class="size-3.5" />
									</button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="w-44">
								<DropdownMenu.Item onclick={() => handleAddMilestone(project)}>
									<IconPlus class="mr-2 size-3.5" />
									Add milestone
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item onclick={() => handleEditProject(project)}>
									<IconEdit class="mr-2 size-3.5" />
									Edit project
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={() => handleCopyProjectLink(project)}>
									<IconLink class="mr-2 size-3.5" />
									Copy link
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item
									class="text-destructive focus:text-destructive"
									onclick={() => handleDeleteProject(project)}
								>
									<IconTrash class="mr-2 size-3.5" />
									Delete project
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>

					<!-- Milestones -->
					{#if isProjectOpen}
						<div class="ml-3 border-l border-border/40 pl-2">
							{#each projectMilestones as milestone (milestone.id)}
								{@const isActiveMilestone = milestone.id === currentMilestoneId}
								<div class="group flex items-center rounded-md hover:bg-muted/50 {isActiveMilestone ? 'bg-muted/30' : ''}">
									<button
										class="flex flex-1 items-center gap-1.5 py-1 pl-1 text-left"
										onclick={() => goto('/p/' + project.id + '/m/' + milestone.id)}
									>
										<IconFlag3 class="size-3 shrink-0 text-muted-foreground" />
										<span class="truncate text-xs text-muted-foreground group-hover:text-foreground {isActiveMilestone ? 'text-foreground font-medium' : ''}">
											{milestone.name}
										</span>
									</button>

									<!-- Milestone options -->
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											{#snippet child({ props })}
												<button
													{...props}
													class="mr-1 flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
												>
													<IconDotsVertical class="size-3" />
												</button>
											{/snippet}
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end" class="w-44">
											<DropdownMenu.Item onclick={() => handleAddSprint(milestone)}>
												<IconPlus class="mr-2 size-3.5" />
												Create sprint
											</DropdownMenu.Item>
											<DropdownMenu.Separator />
											<DropdownMenu.Item onclick={() => handleEditMilestone(milestone)}>
												<IconEdit class="mr-2 size-3.5" />
												Edit milestone
											</DropdownMenu.Item>
											<DropdownMenu.Item onclick={() => handleCopyMilestoneLink(project.id, milestone.id)}>
												<IconLink class="mr-2 size-3.5" />
												Copy link
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</div>
							{/each}

							{#if projectMilestones.length === 0}
								<button
									class="flex w-full items-center gap-1.5 rounded py-1 pl-1 text-left text-xs text-muted-foreground/60 hover:text-muted-foreground"
									onclick={() => handleAddMilestone(project)}
								>
									<IconPlus class="size-3" />
									Add milestone
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</nav>

		<!-- Collapse -->
		<div class="border-t border-border p-2">
			<Button
				variant="ghost"
				size="icon"
				class="size-8"
				onclick={() => sidebarOpen.update((v) => !v)}
				title="Collapse sidebar"
			>
				<IconLayoutSidebarLeftCollapse class="size-4" />
			</Button>
		</div>
	{/if}
</aside>

<!-- Expand button when collapsed -->
{#if !$sidebarOpen}
	<div class="fixed left-2 top-3 z-50">
		<Button
			variant="ghost"
			size="icon"
			class="size-8"
			onclick={() => sidebarOpen.update((v) => !v)}
			title="Open sidebar"
		>
			<IconLayoutSidebarLeftExpand class="size-4" />
		</Button>
	</div>
{/if}
