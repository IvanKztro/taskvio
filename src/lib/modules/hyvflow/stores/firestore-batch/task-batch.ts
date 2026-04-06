import type { Milestone } from '$lib/modules/hyvflow/types/milestone';
import { TaskStatus, type Task } from '$lib/modules/hyvflow/types/task';
import { collection, doc, Firestore, getDocs, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import { firebaseService } from 'svelte-firekit';
import { toast } from 'svelte-sonner';

function getFireStore() {
	return firebaseService.getDbInstance();
}

export async function cloneTask(batch: any, task: any, projectId: string, milestoneId: string) {
	const newTaskId = `${task.id}c1`;
	const firestore = getFireStore();
	const taskRef = doc(firestore as Firestore, `projects/${projectId}/milestones/${milestoneId}/tasks/${newTaskId}`);
	const { tasks: subtasks, ...taskData } = task;
	batch.set(taskRef, {
		...taskData,
		id: newTaskId,
		milestoneId,
		parentId: task?.parentId ? `${task.parentId}c1` : ''
	});
}

export async function cloneTaskBatch(task: Task, milestone: Milestone) {
	const firestore = getFireStore();
	const batch = writeBatch(firestore as Firestore);
	try {
		await cloneTaskRecursively(batch, task, milestone.projectId, milestone.id);
		await batch.commit();
		toast.success('Task cloned successfully');
	} catch (error) {
		toast.error('Error cloning Task');
		throw error;
	}
}

async function cloneTaskRecursively(
	batch: any,
	task: any,
	projectId: string,
	milestoneId: string,
	parentCopyId?: string
) {
	const newTaskId = `${task.id}c1`;
	const firestore = getFireStore();
	const taskRef = doc(firestore as Firestore, `projects/${projectId}/milestones/${milestoneId}/tasks/${newTaskId}`);
	const { tasks: subtasks = [], ...taskData } = task;
	batch.set(taskRef, {
		...taskData,
		id: newTaskId,
		milestoneId,
		name: `${task.name}-copy`,
		parentId: parentCopyId ? parentCopyId : ''
	});
	for (const subtask of subtasks) {
		await cloneTaskRecursively(batch, subtask, projectId, milestoneId, newTaskId);
	}
}

export async function deleteTaskRecursively(task: Task, milestone: Milestone) {
	const firestore = getFireStore();
	const batch = writeBatch(firestore as Firestore);
	try {
		const processTaskDeletion = (taskToDelete: Task) => {
			const taskRef = doc(firestore as Firestore, `projects/${milestone.projectId}/milestones/${milestone.id}/tasks/${taskToDelete.id}`);
			batch.update(taskRef, { status: TaskStatus.Canceled });
			if (taskToDelete.tasks && taskToDelete.tasks.length > 0) {
				taskToDelete.tasks.forEach((subtask) => processTaskDeletion(subtask));
			}
		};
		processTaskDeletion(task);
		await batch.commit();
	} catch (error) {
		toast.error('Error deleting Task');
		throw error;
	}
}

export async function updateTasksPositionsByDragDrop(tasks: Task[], milestone: Milestone) {
	const firestore = getFireStore();
	const batch = writeBatch(firestore as Firestore);
	try {
		for (let i = 0; i < tasks.length; i++) {
			const task = { ...tasks[i], position: i + 1 };
			const taskRef = doc(firestore as Firestore, `projects/${milestone.projectId}/milestones/${milestone.id}/tasks/${task.id}`);
			batch.update(taskRef, {
				position: task.position,
				sprintId: task.sprintId,
				status: task.status,
				parentId: task?.parentId ? task.parentId : '',
				activities: task?.activities || []
			});
		}
		await batch.commit();
	} catch (error) {
		throw error;
	}
}

export async function moveTaskTree(task: Task, fromPath: string, toPath: string) {
	const firestore = getFireStore();
	const batch = writeBatch(firestore as Firestore);
	await moveRecursively(batch, task, fromPath, toPath);
	await batch.commit();
}

async function moveRecursively(batch: any, task: Task, fromPath: string, toPath: string, newParentId = '') {
	const firestore = getFireStore();
	const fromTaskRef = doc(firestore as Firestore, `${fromPath}/tasks/${task.id}`);
	const toTaskRef = doc(firestore as Firestore, `${toPath}/tasks/${task.id}`);
	batch.set(toTaskRef, { ...task, parentId: newParentId, milestoneId: task.milestoneId, sprintId: task.sprintId });
	batch.delete(fromTaskRef);
	const subtasksQuery = query(collection(firestore as Firestore, `${fromPath}/tasks`), where('parentId', '==', task.id));
	const subtasksSnap = await getDocs(subtasksQuery);
	for (const subtaskDoc of subtasksSnap.docs) {
		await moveRecursively(batch, subtaskDoc.data() as Task, fromPath, toPath, task.id);
	}
}

export async function updateTaskStatusRecursively(task: Task, milestone: Milestone, newStatus: string, activities: any[] = []) {
	const firestore = getFireStore();
	const batch = writeBatch(firestore as Firestore);
	try {
		const processTaskUpdate = async (taskToUpdate: Task, activitiesToAdd: any[] = []) => {
			const taskRef = doc(firestore as Firestore, `projects/${milestone.projectId}/milestones/${milestone.id}/tasks/${taskToUpdate.id}`);
			const updateData: any = {
				status: newStatus,
				activities: [...(taskToUpdate.activities || []), ...activitiesToAdd]
			};
			if (newStatus === TaskStatus.Complete) {
				updateData.endDate = Timestamp.now();
				updateData.position = 1;
			}
			batch.update(taskRef, updateData);
			const subtasksQuery = query(
				collection(firestore as Firestore, `projects/${milestone.projectId}/milestones/${milestone.id}/tasks`),
				where('parentId', '==', taskToUpdate.id),
				where('status', '!=', TaskStatus.Canceled)
			);
			const subtasksSnap = await getDocs(subtasksQuery);
			for (const subtaskDoc of subtasksSnap.docs) {
				await processTaskUpdate(subtaskDoc.data() as Task, activitiesToAdd);
			}
		};
		await processTaskUpdate(task, activities);
		await batch.commit();
		toast.success('Task and subtasks updated successfully');
	} catch (error) {
		toast.error('Error updating task and subtasks');
		throw error;
	}
}
