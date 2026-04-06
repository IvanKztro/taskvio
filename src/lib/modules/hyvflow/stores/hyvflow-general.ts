import { writable, derived } from 'svelte/store';
import { page } from '$app/stores';
import type { Task } from '$lib/modules/hyvflow/types/task';
import type { Milestone, SprintApp } from '$lib/modules/hyvflow/types/milestone';
import type { Project } from '$lib/modules/hyvflow/types/project';

export let sidebarOpen = writable<boolean>(true);
export let openinformationitem = writable<boolean>(false);
export let typeitem = writable<string>();
export let iteminfo = writable<Task | Milestone | SprintApp | Project | any>();

export const pathSegments = derived(page, ($page) => {
	return $page.url.pathname.split('/').filter(Boolean);
});

// URL: /p/[projectId]/m/[milestoneId]
// segments: ['p', 'projectId', 'm', 'milestoneId']
export const projectStoreId = derived(pathSegments, ($s) => $s[1] ?? null);
export const milestoneStoreId = derived(pathSegments, ($s) => $s[3] ?? null);
