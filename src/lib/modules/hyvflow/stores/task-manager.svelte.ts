import { NotificationType, type AppNotification } from '$lib/modules/hyvflow/types/notifications';
import { TaskStatus, type ActivityTask, type Task } from '$lib/modules/hyvflow/types/task';
import { setMentionsToNotification } from '$lib/utils';
import { Timestamp, where, orderBy } from 'firebase/firestore';
import { firekitDocMutations, firekitUser, firekitCollection } from 'svelte-firekit';
import { notificationManager } from '$lib/modules/hyvflow/stores/notifications-manager.svelte';
import {
	isopendeletetask,
	milestoneInfo,
	tasktodelete,
	refreshTaskTree
} from '$lib/modules/hyvflow/stores/actions/tasks-action';
import type { Milestone } from '$lib/modules/hyvflow/types/milestone';
import { deleteTaskRecursively } from '$lib/modules/hyvflow/stores/firestore-batch/task-batch';
import { projectManager } from './project-manager.svelte';

class TaskManager {
	private static instance: TaskManager;
	private projectId: string = '';
	private milestoneId: string = '';

	setIds(pid: string, mid: string) {
		this.projectId = pid;
		this.milestoneId = mid;
	}

	haveIds() {
		return this.projectId !== '' && this.milestoneId !== '';
	}

	static getInstance(): TaskManager {
		if (!TaskManager.instance) {
			TaskManager.instance = new TaskManager();
		}
		return TaskManager.instance;
	}

	async createTask(data: Partial<Task>): Promise<any> {
		if (data.dueDate) data.dueDate = Timestamp.fromDate(data.dueDate);
		else delete data.dueDate;
		if (data.startDate) data.startDate = Timestamp.fromDate(data.startDate);
		else delete data.startDate;

		const result = await firekitDocMutations.add(
			`projects/${this.projectId}/milestones/${this.milestoneId}/tasks`,
			{ ...data }
		);

		refreshTaskTree.update((n) => n + 1);
		return result;
	}

	async updateTask(data: Partial<Task>, taskid: string): Promise<any> {
		const result = await firekitDocMutations.update(
			`projects/${this.projectId}/milestones/${this.milestoneId}/tasks/${taskid}`,
			{ ...data }
		);
		refreshTaskTree.update((n) => n + 1);
		return result;
	}

	async updatedName(task: Task, newname: string) {
		const newactivity: ActivityTask = {
			createdBy: firekitUser.uid as string,
			createdAt: Timestamp.now(),
			typeAct: 'act',
			description: `Changed task name: ${newname}`
		};
		taskManager.addNewActivity(newactivity, task, { updated: { name: newname } });
	}

	async addNewActivity(
		payload: ActivityTask,
		task: Task,
		options?: { updated?: Partial<Task>; typeNotification?: NotificationType }
	) {
		let acttemp: ActivityTask[] = task?.activities || [];
		acttemp = acttemp.length === 0 ? [payload] : [...acttemp, payload];

		const projectId = projectManager.projectData?.id;
		const updated = options?.updated;
		const typeNotification = options?.typeNotification;

		this.updateTask({ activities: acttemp, ...(updated ? { ...updated } : {}) }, task.id);

		let assignees = task.assignees || [];
		const mentions = setMentionsToNotification(assignees).filter((a) => a !== firekitUser.uid);

		if (mentions.length > 0) {
			await notificationManager.createNewNotification({
				link: `/p/${projectId}/m/${task?.milestoneId}/${task?.id}`,
				mentions,
				title: `Task: ${task.name}`,
				typeNotification: typeNotification || NotificationType.Updates,
				typeItem: 'task',
				description: `${payload.description} to the task.`,
				createdBy: firekitUser.uid as string,
				unreadBy: mentions,
				itemId: task.id
			});
		}

		refreshTaskTree.update((n) => n + 1);
	}

	async deleteTask(task: Task, milestone: Milestone): Promise<any> {
		await deleteTaskRecursively(task, milestone);
		tasktodelete.set(null);
		milestoneInfo.set(null);
		isopendeletetask.set(false);
	}

	async getNestedSubtasks(taskId: string): Promise<Task[]> {
		if (!this.projectId || !this.milestoneId) return [];

		const tasksPath = `projects/${this.projectId}/milestones/${this.milestoneId}/tasks`;
		const subtasksCollection = firekitCollection<Task>(tasksPath, [
			where('parentId', '==', taskId),
			where('status', '!=', TaskStatus.Canceled),
			orderBy('status'),
			orderBy('position')
		]);

		const subtasksData = await subtasksCollection.getFromServer();
		const subtasks: Task[] = [];

		for (const task of subtasksData) {
			task.tasks = await this.getNestedSubtasks(task.id);
			subtasks.push(task);
		}

		return subtasks;
	}

	async getTaskWithSubtasks(task: Task): Promise<Task> {
		const taskWithSubtasks = { ...task };
		taskWithSubtasks.tasks = await this.getNestedSubtasks(task.id);
		return taskWithSubtasks;
	}
}

export const taskManager = TaskManager.getInstance();
