import type { Timestamp } from 'firebase/firestore';

export interface Milestone {
	id: string;
	projectId: string;
	name: string;
	description?: string;
	dueDate?: Timestamp;
	startDate?: Timestamp;
	createdBy: string;
	createdAt: Timestamp;
	status: MilestoneStatus;
	arrayStatus: ArrayStatus[];
	arraySprints?: SprintApp[];
	trackTime?: string;
	timeEstimate?: string;
	color?: string;
	priority?: MilestonePriority;
	position?: number;
	sprints?: any;
	tasks?: any;
}

export enum MilestoneStatus {
	Active = 'Active',
	Archived = 'Archived',
	Hidden = 'Hidden',
	InProgress = 'InProgress',
	InReview = 'InReview',
	Complete = 'Complete',
	Canceled = 'Canceled',
	Paused = 'Paused'
}

export interface ArrayStatus {
	position: number;
	color: string;
	name: string;
	status: string;
	description?: string;
	tasks?: any;
}

export interface SprintApp {
	id: string;
	name: string;
	position: number;
	startDate?: Timestamp;
	endDate?: Timestamp;
	tasks?: any[];
	statuses?: any;
}

export enum MilestonePriority {
	Urgent = 'Urgent',
	High = 'High',
	Normal = 'Normal',
	Low = 'Low'
}
