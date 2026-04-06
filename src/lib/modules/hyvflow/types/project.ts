import type { Timestamp } from 'firebase/firestore';
import type { Milestone } from './milestone';

export interface Project {
	id: string;
	name: string;
	description: string;
	status: ProjectStatus;
	createdBy: string;
	createdAt: Timestamp;
	position: number;

	startDate?: Timestamp;
	dueDate?: Timestamp;
	price?: number;
	vision?: any;
	objectives?: string;
	risks?: string;
	scope?: string;
	requirements?: string;
	resources?: number;
	members?: string[];
	color?: string;

	milestones?: Milestone[];
}

export enum ProjectStatus {
	Active = 'Active',
	Archived = 'Archived',
	Hidden = 'Hidden',
	InProgress = 'InProgress',
	InReview = 'InReview',
	Complete = 'Complete',
	Canceled = 'Canceled',
	Paused = 'Paused'
}
