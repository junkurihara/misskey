/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NotesRepository, ClipsRepository, ClipNotesRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account', 'notes', 'clips'],

	requireCredential: false,

	kind: 'read:account',

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: '1d7645e6-2b6d-4635-b0fe-fe22b0e72e00',
		},
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		clipId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		search: { type: 'string', minLength: 1, maxLength: 100, nullable: true },
	},
	required: ['clipId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.clipNotesRepository)
		private clipNotesRepository: ClipNotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const clip = await this.clipsRepository.findOneBy({
				id: ps.clipId,
			});

			if (clip == null) {
				throw new ApiError(meta.errors.noSuchClip);
			}

			if (!clip.isPublic && (me == null || (clip.userId !== me.id))) {
				throw new ApiError(meta.errors.noSuchClip);
			}

			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.innerJoin(this.clipNotesRepository.metadata.targetName, 'clipNote', 'clipNote.noteId = note.id')
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.andWhere('clipNote.clipId = :clipId', { clipId: clip.id });

			this.queryService.generateVisibilityQuery(query, me);
			this.queryService.generateBlockedHostQueryForNote(query);
			// this.queryService.generateSuspendedUserQueryForNote(query); // To avoid problems with removing notes, ignoring suspended user for now
			if (me) {
				this.queryService.generateMutedUserQueryForNotes(query, me);
				this.queryService.generateBlockedUserQueryForNotes(query, me);
				this.queryService.generateMutedUserQueryForNotes(query, me, { noteColumn: 'renote' });
				this.queryService.generateBlockedUserQueryForNotes(query, me, { noteColumn: 'renote' });
			}

			if (ps.search != null) {
				for (const word of ps.search.trim().split(' ')) {
					query.andWhere(new Brackets(qb => {
						qb.orWhere('note.text ILIKE :search', { search: `%${sqlLikeEscape(word)}%` });
						qb.orWhere('note.cw ILIKE :search', { search: `%${sqlLikeEscape(word)}%` });
					}));
				}
			}

			const notes = await query
				.limit(ps.limit)
				.getMany();

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
