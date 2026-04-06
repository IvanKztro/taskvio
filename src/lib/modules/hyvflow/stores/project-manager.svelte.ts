import { MilestoneStatus, type Milestone } from '$lib/modules/hyvflow/types/milestone';
import { ProjectStatus, type Project } from '$lib/modules/hyvflow/types/project';
import { TaskStatus, type Task } from '$lib/modules/hyvflow/types/task';
import { or, where } from 'firebase/firestore';
import { firekitCollection, firekitDoc, firekitDocMutations, firekitUser } from 'svelte-firekit';

class ProjectManager {
	private static instance: ProjectManager;

	private _projectId: string = $state('');
	private _milestoneId: string = $state('');
	private _uid = $derived(firekitUser.uid);

	private _projectsCollection = $derived(
		firekitCollection<Project>('projects', [
			or(where('createdBy', '==', this._uid), where('members', 'array-contains', this._uid))
		] as any)
	);

	private _milestonesCollection = $derived.by(() => {
		if (this._projectId) {
			return firekitCollection<Milestone>(`projects/${this._projectId}/milestones`, [
				where('status', '!=', MilestoneStatus.Canceled)
			]);
		}
		return { data: [], loading: false };
	});

	private _projectDoc = $derived.by(() => {
		return this._projectId ? firekitDoc<Project>(`projects/${this._projectId}`) : null;
	});

	private _milestoneDoc = $derived.by(() => {
		return this._projectId && this._milestoneId
			? firekitDoc<Milestone>(`projects/${this._projectId}/milestones/${this._milestoneId}`)
			: null;
	});

	private _tasksCollection = $derived.by(() => {
		return this._projectId && this._milestoneId
			? firekitCollection<Task>(
					`projects/${this._projectId}/milestones/${this._milestoneId}/tasks`,
					[where('status', '!=', TaskStatus.Canceled)]
				)
			: null;
	});

	private _membersCollection = $derived.by(() => {
		const project = this.projectData;
		const members = [...(project?.members || [])];
		if (project?.createdBy && !members.includes(project.createdBy)) {
			members.push(project.createdBy);
		}
		if (members.length === 0) return { data: [], loading: false };
		return firekitCollection<any>('users', [where('uid', 'in', members)]);
	});

	public projects: Project[] = $derived(this._projectsCollection.data ?? []);
	public milestones: Milestone[] = $derived(
		(this._milestonesCollection as any).data ?? []
	);
	public projectData: Project = $derived(this._projectDoc?.data as Project);
	public milestoneData: Milestone = $derived(this._milestoneDoc?.data as Milestone);
	public tasks: Task[] = $derived(this._tasksCollection?.data ?? []);
	public projectMembers: any[] = $derived((this._membersCollection as any).data ?? []);
	public loading: boolean = $derived(this._projectsCollection.loading);

	private constructor() {}

	static getInstance(): ProjectManager {
		if (!ProjectManager.instance) {
			ProjectManager.instance = new ProjectManager();
		}
		return ProjectManager.instance;
	}

	get projectId(): string {
		return this._projectId;
	}

	get milestoneId(): string {
		return this._milestoneId;
	}

	set projectId(id: string) {
		this._projectId = id;
	}

	set milestoneId(id: string) {
		this._milestoneId = id;
	}
}

export const projectManager = ProjectManager.getInstance();
