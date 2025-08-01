/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { noteVisibilities, noteReactionAcceptances } from '@/types.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiChannel } from './Channel.js';
import type { MiDriveFile } from './DriveFile.js';

// Note: When you create a new index for existing column of this table,
// it might be better to index concurrently under isConcurrentIndexMigrationEnabled flag
// by editing generated migration file since this table is very large,
// and it will make a long lock to create index in most cases.
// Please note that `CREATE INDEX CONCURRENTLY` is not supported in transaction,
// so you need to set `transaction = false` in migration if isConcurrentIndexMigrationEnabled() is true.
// Please refer 1745378064470-composite-note-index.js for example.
// You should not use `@Index({ concurrent: true })` decorator because database initialization for test will fail
// because it will always run CREATE INDEX in transaction based on decorators.
// Not appending `{ concurrent: true }` to `@Index` will not cause any problem in production,

@Index(['userId', 'id']) // Note: this index is ("userId", "id" DESC) in production, but not in test.
@Entity('note')
export class MiNote {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of reply target.',
	})
	public replyId: MiNote['id'] | null;

	@ManyToOne(type => MiNote, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn()
	public reply: MiNote | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of renote target.',
	})
	public renoteId: MiNote['id'] | null;

	@ManyToOne(type => MiNote, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn()
	public renote: MiNote | null;

	@Index()
	@Column('varchar', {
		length: 256, nullable: true,
	})
	public threadId: string | null;

	// TODO: varcharにしたい
	@Column('text', {
		nullable: true,
	})
	public text: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public name: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
	})
	public cw: string | null;

	@Column({
		...id(),
		comment: 'The ID of author.',
	})
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('boolean', {
		default: false,
	})
	public localOnly: boolean;

	@Column('varchar', {
		length: 64, nullable: true,
	})
	public reactionAcceptance: typeof noteReactionAcceptances[number];

	@Column('smallint', {
		default: 0,
	})
	public renoteCount: number;

	@Column('smallint', {
		default: 0,
	})
	public repliesCount: number;

	@Column('smallint', {
		default: 0,
	})
	public clippedCount: number;

	@Column('jsonb', {
		default: {},
	})
	public reactions: Record<string, number>;

	/**
	 * public ... 公開
	 * home ... ホームタイムライン(ユーザーページのタイムライン含む)のみに流す
	 * followers ... フォロワーのみ
	 * specified ... visibleUserIds で指定したユーザーのみ
	 */
	@Column('enum', { enum: noteVisibilities })
	public visibility: typeof noteVisibilities[number];

	@Index({ unique: true })
	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The URI of a note. it will be null when the note is local.',
	})
	public uri: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The human readable url of a note. it will be null when the note is local.',
	})
	public url: string | null;

	@Index('IDX_NOTE_FILE_IDS', { synchronize: false })
	@Column({
		...id(),
		array: true, default: '{}',
	})
	public fileIds: MiDriveFile['id'][];

	@Column('varchar', {
		length: 256, array: true, default: '{}',
	})
	public attachedFileTypes: string[];

	@Index('IDX_NOTE_VISIBLE_USER_IDS', { synchronize: false })
	@Column({
		...id(),
		array: true, default: '{}',
	})
	public visibleUserIds: MiUser['id'][];

	@Index('IDX_NOTE_MENTIONS', { synchronize: false })
	@Column({
		...id(),
		array: true, default: '{}',
	})
	public mentions: MiUser['id'][];

	@Column('text', {
		default: '[]',
	})
	public mentionedRemoteUsers: string;

	@Column('varchar', {
		length: 1024, array: true, default: '{}',
	})
	public reactionAndUserPairCache: string[];

	@Column('varchar', {
		length: 128, array: true, default: '{}',
	})
	public emojis: string[];

	@Index('IDX_NOTE_TAGS', { synchronize: false })
	@Column('varchar', {
		length: 128, array: true, default: '{}',
	})
	public tags: string[];

	@Column('boolean', {
		default: false,
	})
	public hasPoll: boolean;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of source channel.',
	})
	public channelId: MiChannel['id'] | null;

	@ManyToOne(type => MiChannel, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public channel: MiChannel | null;

	//#region Denormalized fields
	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public userHost: string | null;

	@Column({
		...id(),
		nullable: true,
		comment: '[Denormalized]',
	})
	public replyUserId: MiUser['id'] | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public replyUserHost: string | null;

	@Column({
		...id(),
		nullable: true,
		comment: '[Denormalized]',
	})
	public renoteUserId: MiUser['id'] | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public renoteUserHost: string | null;

	constructor(data: Partial<MiNote>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

export type IMentionedRemoteUsers = {
	uri: string;
	url?: string;
	username: string;
	host: string;
}[];
