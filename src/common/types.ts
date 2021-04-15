export interface TagData {
	tags: Record<string, Tag>;
	alias: Record<string, string>;
	tagGroups: Record<string, string[]>;
}

export enum TagType {
	GENERAL,
	ARTIST,
	COPYRIGHT = 3,
	CHARACTER,
	SPECIES,
	META = 7,
	LORE,
}

export interface Tag {
	count: number;
	type: TagType;
	implies: string[];
	impliedBy: string[];
	hint?: string;
}
