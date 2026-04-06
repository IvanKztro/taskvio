export type FavType = 'subtask' | 'milestone' | 'project';

export type FavItem = string;

export type FavData = {
	milestone?: FavItem[];
	project?: FavItem[];
	subtask?: FavItem[];
};

export type FavListItem = {
	value: string;
	projectId?: string;
};

export type FavList = {
	milestone?: FavListItem[];
	project?: FavListItem[];
	subtask?: FavListItem[];
};
