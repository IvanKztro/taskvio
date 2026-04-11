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
	import { firekitCollection, firekitUser, firekitAuth } from 'svelte-firekit';
	import { IconLogout } from '@tabler/icons-svelte';
	import { toggleMode } from 'mode-watcher';
	import { IconSun, IconMoon } from '@tabler/icons-svelte';
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

	// $state map of firekitCollection instances keyed by projectId.
	// Being $state means the template re-renders when new projects are added,
	// and since each col._data is also $state, reading col.data in the template
	// is fully reactive — no separate cache needed.
	let projectCollections = $state<Record<string, { data: Milestone[] }>>({});

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

	// Returns milestones for a project. Reads col.data directly (reactive in template context).
	// Falls back to projectManager.milestones for the active project while the collection loads.
	function getMilestones(projectId: string): Milestone[] {
		const fromCol = projectCollections[projectId]?.data ?? [];
		if (fromCol.length > 0) return fromCol;
		if (projectId === currentProjectId) return projectManager.milestones;
		return [];
	}

	// Create a firekitCollection for every project the first time it appears.
	// Only WRITES to projectCollections (never reads .data here) → no reactive cycle.
	$effect(() => {
		for (const project of projects) {
			if (!projectCollections[project.id]) {
				projectCollections = {
					...projectCollections,
					[project.id]: firekitCollection<Milestone>(
						`projects/${project.id}/milestones`,
						[where('status', '!=', MilestoneStatus.Canceled)]
					)
				};
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
			<span class="flex-1 text-sm font-bold">TaskIO</span>
			<Button variant="ghost" size="icon" class="size-7" onclick={toggleMode} title="Toggle theme">
				<IconSun class="size-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
				<IconMoon class="absolute size-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
			</Button>
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
					<div class="group flex items-center rounded-md hover:bg-muted/50 {isActiveProject ? 'bg-primary/10 border border-primary/20' : ''}">
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
							class="flex flex-1 items-center gap-1.5 py-1.5 text-left text-sm font-medium {isActiveProject ? 'text-primary' : ''}"
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
								<div class="group flex items-center rounded-md hover:bg-muted/50">
									<button
										class="flex flex-1 items-center gap-1.5 py-1 pl-1 text-left"
										onclick={() => goto('/p/' + project.id + '/m/' + milestone.id)}
									>
										<IconFlag3 class="size-3 shrink-0 text-muted-foreground" />
										<span class="truncate text-xs {isActiveMilestone ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-foreground'}">
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

		<!-- User + Collapse -->
		<div class="flex items-center gap-2 border-t border-border px-3 py-2">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="flex flex-1 min-w-0 items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50 transition-colors text-left">
					{#if firekitUser?.photoURL}
						<img src={firekitUser.photoURL} alt="avatar" class="size-7 shrink-0 rounded-full object-cover" />
					{:else}
						<div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
							{firekitUser?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
						</div>
					{/if}
					<div class="flex min-w-0 flex-col">
						<span class="truncate text-xs font-medium leading-tight">{firekitUser?.displayName ?? 'User'}</span>
						<span class="truncate text-[10px] leading-tight text-muted-foreground">{firekitUser?.email ?? ''}</span>
					</div>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="start" side="top" class="w-52 mb-1">
					<DropdownMenu.Label class="text-xs font-normal text-muted-foreground truncate px-2 py-1">
						{firekitUser?.email ?? ''}
					</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item
						class="text-destructive focus:text-destructive cursor-pointer"
						onclick={async () => { await firekitAuth.signOut(); goto('/sign-in'); }}
					>
						<IconLogout class="mr-2 size-3.5" />
						Log out
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<Button
				variant="ghost"
				size="icon"
				class="size-7 shrink-0"
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
