<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 700px;">
	<MkPagination v-slot="{items}" :pagination="pagination">
		<div v-for="item in items" :key="item.id" :to="`/clips/${item.id}`" class="_panel _margin">
			<div :class="$style.header">
				<MkAvatar :class="$style.avatar" :user="user"/>
				<MkReactionIcon :class="$style.reaction" :reaction="item.type" :noStyle="true"/>
				<MkTime :time="item.createdAt" :class="$style.createdAt"/>
			</div>
			<MkNote :key="item.id" :note="item.note"/>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import MkNote from '@/components/MkNote.vue';
import MkReactionIcon from '@/components/MkReactionIcon.vue';

const props = defineProps<{
	user: Misskey.entities.User;
}>();

const pagination = {
	endpoint: 'users/reactions' as const,
	limit: 20,
	params: computed(() => ({
		userId: props.user.id,
	})),
};
</script>

<style lang="scss" module>
.header {
	display: flex;
	align-items: center;
	padding: 8px 16px;
	margin-bottom: 8px;
	border-bottom: solid 2px var(--MI_THEME-divider);
}

.avatar {
	width: 24px;
	height: 24px;
	margin-right: 8px;
}

.reaction {
	width: 32px;
	height: 32px;
}

.createdAt {
	margin-left: auto;
}
</style>
