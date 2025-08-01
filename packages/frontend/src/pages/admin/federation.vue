<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div class="_gaps">
			<div>
				<MkInput v-model="host" :debounce="true" class="">
					<template #prefix><i class="ti ti-search"></i></template>
					<template #label>{{ i18n.ts.host }}</template>
				</MkInput>
				<FormSplit style="margin-top: var(--MI-margin);">
					<MkSelect v-model="state">
						<template #label>{{ i18n.ts.state }}</template>
						<option value="all">{{ i18n.ts.all }}</option>
						<option value="federating">{{ i18n.ts.federating }}</option>
						<option value="subscribing">{{ i18n.ts.subscribing }}</option>
						<option value="publishing">{{ i18n.ts.publishing }}</option>
						<option value="suspended">{{ i18n.ts.suspended }}</option>
						<option value="blocked">{{ i18n.ts.blocked }}</option>
						<option value="silenced">{{ i18n.ts.silence }}</option>
						<option value="notResponding">{{ i18n.ts.notResponding }}</option>
					</MkSelect>
					<MkSelect v-model="sort">
						<template #label>{{ i18n.ts.sort }}</template>
						<option value="+pubSub">{{ i18n.ts.pubSub }} ({{ i18n.ts.descendingOrder }})</option>
						<option value="-pubSub">{{ i18n.ts.pubSub }} ({{ i18n.ts.ascendingOrder }})</option>
						<option value="+notes">{{ i18n.ts.notes }} ({{ i18n.ts.descendingOrder }})</option>
						<option value="-notes">{{ i18n.ts.notes }} ({{ i18n.ts.ascendingOrder }})</option>
						<option value="+users">{{ i18n.ts.users }} ({{ i18n.ts.descendingOrder }})</option>
						<option value="-users">{{ i18n.ts.users }} ({{ i18n.ts.ascendingOrder }})</option>
						<option value="+following">{{ i18n.ts.following }} ({{ i18n.ts.descendingOrder }})</option>
						<option value="-following">{{ i18n.ts.following }} ({{ i18n.ts.ascendingOrder }})</option>
						<option value="+followers">{{ i18n.ts.followers }} ({{ i18n.ts.descendingOrder }})</option>
						<option value="-followers">{{ i18n.ts.followers }} ({{ i18n.ts.ascendingOrder }})</option>
						<option value="+firstRetrievedAt">{{ i18n.ts.registeredAt }} ({{ i18n.ts.descendingOrder }})</option>
						<option value="-firstRetrievedAt">{{ i18n.ts.registeredAt }} ({{ i18n.ts.ascendingOrder }})</option>
					</MkSelect>
				</FormSplit>
			</div>

			<MkPagination v-slot="{items}" :key="host + state" :paginator="paginator">
				<div :class="$style.instances">
					<MkA v-for="instance in items" :key="instance.id" v-tooltip.mfm="`Status: ${getStatus(instance)}`" :class="$style.instance" :to="`/instance-info/${instance.host}`">
						<MkInstanceCardMini :instance="instance"/>
					</MkA>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { computed, markRaw, ref } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkInstanceCardMini from '@/components/MkInstanceCardMini.vue';
import FormSplit from '@/components/form/split.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { Paginator } from '@/utility/paginator.js';

const host = ref('');
const state = ref('federating');
const sort = ref('+pubSub');
const paginator = markRaw(new Paginator('federation/instances', {
	limit: 10,
	offsetMode: true,
	computedParams: computed(() => ({
		sort: sort.value,
		host: host.value !== '' ? host.value : null,
		...(
			state.value === 'federating' ? { federating: true, suspended: false, blocked: false } :
			state.value === 'subscribing' ? { subscribing: true, suspended: false, blocked: false } :
			state.value === 'publishing' ? { publishing: true, suspended: false, blocked: false } :
			state.value === 'suspended' ? { suspended: true } :
			state.value === 'blocked' ? { blocked: true } :
			state.value === 'silenced' ? { silenced: true } :
			state.value === 'notResponding' ? { notResponding: true } :
			{}),
	})),
}));

function getStatus(instance: Misskey.entities.FederationInstance) {
	switch (instance.suspensionState) {
		case 'manuallySuspended':
			return 'Manually Suspended';
		case 'goneSuspended':
			return 'Automatically Suspended (Gone)';
		case 'autoSuspendedForNotResponding':
			return 'Automatically Suspended (Not Responding)';
		case 'none':
			break;
	}
	if (instance.isBlocked) return 'Blocked';
	if (instance.isSilenced) return 'Silenced';
	if (instance.isNotResponding) return 'Error';
	return 'Alive';
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.federation,
	icon: 'ti ti-whirl',
}));
</script>

<style lang="scss" module>
.instances {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
	grid-gap: 12px;
}

.instance:hover {
	text-decoration: none;
}
</style>
