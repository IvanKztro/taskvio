import type { SprintApp } from '$lib/modules/hyvflow/types/milestone';
import { firebaseService, firekitCollection, firekitDocMutations } from 'svelte-firekit';
import { toast } from 'svelte-sonner';
import { get, writable } from 'svelte/store';
import { milestoneActions } from './milestone-actions';
import { doc, Firestore, where, writeBatch } from 'firebase/firestore';
import { TaskStatus, type Task } from '$lib/modules/hyvflow/types/task';

export let isopensprint = writable<boolean>(false);
export let isopendeletesprint = writable<boolean>(false);
export let sprintActions = writable<SprintApp | undefined>(undefined);
export let sprintsActions = writable<SprintApp[] | undefined>(undefined);
export let sprintIndexStore = writable<number>(-1);

export async function deleteSprint() {
	const firestore = firebaseService.db;
	const currentSprint = get(sprintActions);
	let sprints = get(sprintsActions);
	const milestone = get(milestoneActions);
	const projectId = milestone?.projectId;
	const milestoneId = milestone?.id;

	if (!currentSprint || !sprints || !projectId || !milestoneId) return;

	sprints = sprints.filter((sprint) => sprint.id !== currentSprint.id);
	const updatedSprints = sprints.map((sprint, index) => ({
		...sprint,
		position: index + 1
	}));

	const tasksCollection = firekitCollection<Task>(
		`projects/${projectId}/milestones/${milestoneId}/tasks`,
		[where('sprintId', '==', currentSprint.id)]
	);
	const tasksData = await tasksCollection.getFromServer();

	if (tasksData.length > 0) {
		const batch = writeBatch(firestore as Firestore);
		tasksData.forEach((taskDoc) => {
			const taskRef = doc(
				firestore as Firestore,
				`projects/${projectId}/milestones/${milestoneId}/tasks/${taskDoc.id}`
			);
			batch.update(taskRef, { status: TaskStatus.Canceled });
		});
		await batch.commit();
	}

	const res = await firekitDocMutations.update(`projects/${projectId}/milestones/${milestoneId}`, {
		arraySprints: updatedSprints
	});

	if (res.success) {
		isopendeletesprint.set(false);
		sprintActions.set(undefined);
		milestoneActions.set(undefined);
		toast.success('Sprint was deleted successfully!');
	} else {
		toast.error('Error deleting Sprint!');
	}
}
