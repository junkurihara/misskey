<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px;">
		<div class="_gaps_m">
			<FormInfo warn>{{ i18n.ts.editTheseSettingsMayBreakAccount }}</FormInfo>

			<template v-if="value">
				<FormSplit>
					<MkKeyValue>
						<template #key>{{ i18n.ts._registry.domain }}</template>
						<template #value>{{ props.domain === '@' ? i18n.ts.system : props.domain.toUpperCase() }}</template>
					</MkKeyValue>
					<MkKeyValue>
						<template #key>{{ i18n.ts._registry.scope }}</template>
						<template #value>{{ scope.join('/') }}</template>
					</MkKeyValue>
					<MkKeyValue>
						<template #key>{{ i18n.ts._registry.key }}</template>
						<template #value>{{ key }}</template>
					</MkKeyValue>
				</FormSplit>

				<MkCodeEditor v-model="valueForEditor" lang="json5">
					<template #label>{{ i18n.ts.value }} (JSON)</template>
				</MkCodeEditor>

				<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>

				<MkKeyValue>
					<template #key>{{ i18n.ts.updatedAt }}</template>
					<template #value><MkTime :time="value.updatedAt" mode="detail"/></template>
				</MkKeyValue>

				<MkButton danger @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
			</template>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { watch, computed, ref } from 'vue';
import JSON5 from 'json5';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkButton from '@/components/MkButton.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkCodeEditor from '@/components/MkCodeEditor.vue';
import FormSplit from '@/components/form/split.vue';
import FormInfo from '@/components/MkInfo.vue';

const props = defineProps<{
	path: string;
	domain: string;
}>();

const scope = computed(() => props.path.split('/').slice(0, -1));
const key = computed(() => props.path.split('/').at(-1));

const value = ref<any>(null);
const valueForEditor = ref<string | null>(null);

function fetchValue() {
	misskeyApi('i/registry/get-detail', {
		scope: scope.value,
		key: key.value,
		domain: props.domain === '@' ? null : props.domain,
	}).then(res => {
		value.value = res;
		valueForEditor.value = JSON5.stringify(res.value, null, '\t');
	});
}

async function save() {
	try {
		JSON5.parse(valueForEditor.value);
	} catch (err) {
		os.alert({
			type: 'error',
			text: i18n.ts.invalidValue,
		});
		return;
	}
	os.confirm({
		type: 'warning',
		text: i18n.ts.saveConfirm,
	}).then(({ canceled }) => {
		if (canceled) return;
		os.apiWithDialog('i/registry/set', {
			scope: scope.value,
			key: key.value,
			value: JSON5.parse(valueForEditor.value),
			domain: props.domain === '@' ? null : props.domain,
		});
	});
}

function del() {
	os.confirm({
		type: 'warning',
		text: i18n.ts.deleteConfirm,
	}).then(({ canceled }) => {
		if (canceled) return;
		os.apiWithDialog('i/registry/remove', {
			scope: scope.value,
			key: key.value,
			domain: props.domain === '@' ? null : props.domain,
		});
	});
}

watch(() => props.path, fetchValue, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.registry,
	icon: 'ti ti-adjustments',
}));
</script>
