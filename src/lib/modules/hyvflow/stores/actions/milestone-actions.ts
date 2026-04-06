import { MilestoneStatus, type Milestone } from '$lib/modules/hyvflow/types/milestone';
import { firekitDocMutations } from 'svelte-firekit';
import { toast } from 'svelte-sonner';
import { get, writable } from 'svelte/store';

export let isopenmilestone = writable<boolean>(false);
export let isopendeletemilestone = writable<boolean>(false);
export let milestoneActions = writable<Milestone | undefined>(undefined);
export let projectIdStore = writable<string>('');

export async function deleteMilestone() {
	const res = await firekitDocMutations.update(
		`projects/${get(milestoneActions)?.projectId}/milestones/${get(milestoneActions)?.id}`,
		{ status: MilestoneStatus.Canceled }
	);

	if (res.success) {
		isopendeletemilestone.set(false);
		milestoneActions.set(undefined);
		toast.success('Milestone was deleted successfully!');
	} else {
		toast.error('Error deleting this Milestone!');
	}
}
