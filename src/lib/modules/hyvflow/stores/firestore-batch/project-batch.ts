import type { Project } from '$lib/modules/hyvflow/types/project';
import { doc, Firestore, writeBatch } from 'firebase/firestore';
import { firebaseService } from 'svelte-firekit';
import { cloneTask } from './task-batch';
import { toast } from 'svelte-sonner';
import { generateId } from '$lib/utils';

function getFireStore() {
	return firebaseService.getDbInstance();
}

export async function cloneProjectBatch(project: Project) {
	const firestore = getFireStore();
	const batch = writeBatch(firestore as Firestore);
	try {
		const newProjectId = generateId();
		const projectRef = doc(firestore as Firestore, `projects/${newProjectId}`);
		const { milestones, ...projectData } = project;
		batch.set(projectRef, { ...projectData, id: newProjectId, name: `${project.name}-copy` });
		for (const milestone of milestones ?? []) {
			const newMilestoneId = generateId();
			const milestoneRef = doc(firestore as Firestore, `projects/${newProjectId}/milestones/${newMilestoneId}`);
			const { tasks, ...milestoneData } = milestone;
			batch.set(milestoneRef, { ...milestoneData, id: newMilestoneId, projectId: newProjectId });
			for (const task of tasks || []) {
				cloneTask(batch, task, newProjectId, newMilestoneId);
			}
		}
		await batch.commit();
		toast.success('Project cloned successfully');
	} catch (error) {
		toast.error('Error cloning Project');
		throw error;
	}
}
