import type { Milestone } from '$lib/modules/hyvflow/types/milestone';
import { collection, doc, Firestore, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { firebaseService } from 'svelte-firekit';
import { cloneTask } from './task-batch';
import { toast } from 'svelte-sonner';
import { generateId } from '$lib/utils';

function getFireStore() {
	return firebaseService.getDbInstance();
}

export async function updateMilestonesPositionsByDragDrop(milestones: Milestone[], projectId: string) {
	const firestore = getFireStore();
	const batch = writeBatch(firestore as Firestore);
	try {
		milestones.forEach((milestone) => {
			const milestoneRef = doc(firestore as Firestore, `projects/${milestone.projectId}/milestones/${milestone.id}`);
			batch.update(milestoneRef, { position: milestone.position, projectId });
		});
		await batch.commit();
	} catch (error) {
		console.error('Error updating milestones positions:', error);
		throw error;
	}
}

export async function cloneMilestoneBatch(milestone: Milestone) {
	const firestore = getFireStore();
	const batch = writeBatch(firestore as Firestore);
	try {
		const newMilestoneId = generateId();
		const milestoneRef = doc(firestore as Firestore, `projects/${milestone.projectId}/milestones/${newMilestoneId}`);
		const { tasks, ...milestoneData } = milestone;
		batch.set(milestoneRef, { ...milestoneData, id: newMilestoneId, name: `${milestone.name}-copy` });
		for (const task of tasks || []) {
			cloneTask(batch, task, milestone.projectId, newMilestoneId);
		}
		await batch.commit();
		toast.success('Milestone cloned successfully');
	} catch (error) {
		toast.error('Error cloning Milestone');
		throw error;
	}
}
