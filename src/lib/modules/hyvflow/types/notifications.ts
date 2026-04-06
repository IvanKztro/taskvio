import type { Timestamp } from 'firebase/firestore';

export interface AppNotification {
	id: string;
	title: string;
	typeNotification: NotificationType;
	typeItem: string;
	description: string;
	createdBy: string;
	createdAt: Timestamp;
	link?: string;
	extrainfo?: string;
	mentions: string[];
	unreadBy: string[];
	itemId: string;
}

export enum NotificationType {
	Updates = 'updates',
	Assignee = 'assignee',
	Status = 'status',
	Link = 'link'
}
