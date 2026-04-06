import type { ArrayStatus } from '$lib/modules/hyvflow/types/milestone';
import { writable } from 'svelte/store';

export let isopenstatus = writable<boolean>(false);
export let sprintIdstatus = writable<string>('');
export let statusActions = writable<ArrayStatus | undefined>(undefined);
