import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import type { Task } from './modules/hyvflow/types/task';
import type { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function getInitials(name: string | null | undefined): string {
	if (!name) return '';
	const nameParts = name.trim().split(' ');
	if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
	return nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();
}

export function generateId(limit: number = 20): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let id = '';
	for (let i = 0; i < limit; i++) {
		id += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return id;
}

export function setMentionsToNotification(mentions: any[]): string[] {
	const ids: Set<string> = new Set();
	mentions.forEach((m) => ids.add(m.uid || m.id || m));
	return Array.from(ids);
}

export function sortTasks(sortType: string, taskstemp: any[]) {
	if (!taskstemp) return [];

	const priorityOrder: Record<string, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 };

	const compareEmpty = (aVal: string, bVal: string) => {
		const isEmptyA = !aVal || aVal.trim() === '';
		const isEmptyB = !bVal || bVal.trim() === '';
		if (isEmptyA && !isEmptyB) return 1;
		if (!isEmptyA && isEmptyB) return -1;
		if (isEmptyA && isEmptyB) return 0;
		return aVal.localeCompare(bVal);
	};

	const sortFunctions: Record<string, (a: any, b: any) => number> = {
		updatedAt: (a, b) => b.updatedAt - a.updatedAt,
		priority: (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
		assignees: (a, b) => compareEmpty(a.assignees?.join(',') || '', b.assignees?.join(',') || ''),
		tags: (a, b) => compareEmpty(a.tags?.map((t: any) => t.title || t).join(',') || '', b.tags?.map((t: any) => t.title || t).join(',') || ''),
		name: (a, b) => a.name.localeCompare(b.name),
		position: (a, b) => a.position - b.position,
		dueDate: (a, b) => a.dueDate - b.dueDate
	};

	return [...taskstemp].sort((a, b) => {
		const sortFn = sortFunctions[sortType];
		if (sortFn) return sortFn(a, b);
		const aVal = a[sortType];
		const bVal = b[sortType];
		if (aVal == null && bVal != null) return 1;
		if (aVal != null && bVal == null) return -1;
		if (aVal == null && bVal == null) return 0;
		return bVal - aVal;
	});
}

export function getLengthComments(task: Task, uid: string) {
	const filterAllComments = task.activities?.filter((act: any) => act.typeAct === 'comment') || [];
	const lastReadUser = (task.lastReadUser as any)?.[uid];
	let filterUnreadComments: any[] = [];
	let hasNewComments = false;

	if (lastReadUser) {
		filterUnreadComments = task.activities?.filter(
			(act: any) =>
				act.typeAct === 'comment' &&
				act.createdAt?.seconds > lastReadUser?.seconds &&
				act.createdBy !== uid
		) || [];
		hasNewComments = filterUnreadComments.length > 0;
	} else if (filterAllComments.length > 0) {
		const lastComment = [...filterAllComments].sort(
			(a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
		)[0];
		if (lastComment.createdBy !== uid) {
			filterUnreadComments = [lastComment];
			hasNewComments = true;
		}
	}

	return { allComments: filterAllComments.length, unreadComments: filterUnreadComments.length, hasNewComments };
}

export function timeAgoDate(timestamp: Timestamp, formatstring = 'MMM d, yyyy', isactivity = false) {
	const fileDate: any = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
	const now: any = new Date();
	const diffDays = (now - fileDate) / 86400000;
	if (diffDays > 14 || isactivity) return format(fileDate, formatstring);
	return formatDistanceToNow(fileDate, { addSuffix: true });
}

export function formatDate(seconds: number, type: string) {
	return format(new Date(seconds * 1000), type);
}

export function timeAgo(date: Date): string {
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	const MINUTE = 60, HOUR = 3600, DAY = 86400, MONTH = 2592000, YEAR = 31536000;
	if (seconds < MINUTE) return 'less than a minute ago';
	let interval = Math.floor(seconds / YEAR);
	if (interval >= 1) return interval === 1 ? '1 year ago' : `${interval} years ago`;
	interval = Math.floor(seconds / MONTH);
	if (interval >= 1) return interval === 1 ? '1 month ago' : `${interval} months ago`;
	interval = Math.floor(seconds / DAY);
	if (interval >= 1) return interval === 1 ? '1 day ago' : `${interval} days ago`;
	interval = Math.floor(seconds / HOUR);
	if (interval >= 1) return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
	interval = Math.floor(seconds / MINUTE);
	return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
}
