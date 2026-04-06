export type MainTab = 'tasks' | 'files';
export type SubTab = 'kanban';

export type OrderField =
	| 'createdAt'
	| 'name'
	| 'dueDate'
	| 'updatedAt'
	| 'priority'
	| 'assignees'
	| 'tags';

export type SprintOrder = Record<string, OrderField>;

export type SprintViewConfig = {
	open: boolean;
	status: Record<string, StatusViewConfig>;
};

export type StatusViewConfig = {
	status: string;
	label: string;
	orderBy: OrderField;
};

export type UserInterface = {
	mainTab: MainTab;
	subTab?: SubTab;
	sprints: Record<string, SprintViewConfig>;
	[key: string]: any;
};
