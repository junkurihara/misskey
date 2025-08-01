<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<div class="_gaps">
			<div class="_panel" style="padding: 16px;">
				<MkSwitch v-model="enableServerMachineStats" @change="onChange_enableServerMachineStats">
					<template #label>{{ i18n.ts.enableServerMachineStats }}</template>
					<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
				</MkSwitch>
			</div>

			<div class="_panel" style="padding: 16px;">
				<MkSwitch v-model="enableIdenticonGeneration" @change="onChange_enableIdenticonGeneration">
					<template #label>{{ i18n.ts.enableIdenticonGeneration }}</template>
					<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
				</MkSwitch>
			</div>

			<div class="_panel" style="padding: 16px;">
				<MkSwitch v-model="enableChartsForRemoteUser" @change="onChange_enableChartsForRemoteUser">
					<template #label>{{ i18n.ts.enableChartsForRemoteUser }}</template>
					<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
				</MkSwitch>
			</div>

			<div class="_panel" style="padding: 16px;">
				<MkSwitch v-model="enableStatsForFederatedInstances" @change="onChange_enableStatsForFederatedInstances">
					<template #label>{{ i18n.ts.enableStatsForFederatedInstances }}</template>
					<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
				</MkSwitch>
			</div>

			<div class="_panel" style="padding: 16px;">
				<MkSwitch v-model="enableChartsForFederatedInstances" @change="onChange_enableChartsForFederatedInstances">
					<template #label>{{ i18n.ts.enableChartsForFederatedInstances }}</template>
					<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
				</MkSwitch>
			</div>

			<MkFolder :defaultOpen="true">
				<template #icon><i class="ti ti-bolt"></i></template>
				<template #label>Misskey® Fan-out Timeline Technology™ (FTT)</template>
				<template v-if="fttForm.savedState.enableFanoutTimeline" #suffix>Enabled</template>
				<template v-else #suffix>Disabled</template>
				<template v-if="fttForm.modified.value" #footer>
					<MkFormFooter :form="fttForm"/>
				</template>

				<div class="_gaps">
					<MkSwitch v-model="fttForm.state.enableFanoutTimeline">
						<template #label>{{ i18n.ts.enable }}<span v-if="fttForm.modifiedStates.enableFanoutTimeline" class="_modified">{{ i18n.ts.modified }}</span></template>
						<template #caption>
							<div>{{ i18n.ts._serverSettings.fanoutTimelineDescription }}</div>
							<div><MkLink target="_blank" url="https://misskey-hub.net/docs/for-admin/features/ftt/">{{ i18n.ts.details }}</MkLink></div>
						</template>
					</MkSwitch>

					<template v-if="fttForm.state.enableFanoutTimeline">
						<MkSwitch v-model="fttForm.state.enableFanoutTimelineDbFallback">
							<template #label>{{ i18n.ts._serverSettings.fanoutTimelineDbFallback }}<span v-if="fttForm.modifiedStates.enableFanoutTimelineDbFallback" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #caption>{{ i18n.ts._serverSettings.fanoutTimelineDbFallbackDescription }}</template>
						</MkSwitch>

						<MkInput v-model="fttForm.state.perLocalUserUserTimelineCacheMax" type="number">
							<template #label>perLocalUserUserTimelineCacheMax<span v-if="fttForm.modifiedStates.perLocalUserUserTimelineCacheMax" class="_modified">{{ i18n.ts.modified }}</span></template>
						</MkInput>

						<MkInput v-model="fttForm.state.perRemoteUserUserTimelineCacheMax" type="number">
							<template #label>perRemoteUserUserTimelineCacheMax<span v-if="fttForm.modifiedStates.perRemoteUserUserTimelineCacheMax" class="_modified">{{ i18n.ts.modified }}</span></template>
						</MkInput>

						<MkInput v-model="fttForm.state.perUserHomeTimelineCacheMax" type="number">
							<template #label>perUserHomeTimelineCacheMax<span v-if="fttForm.modifiedStates.perUserHomeTimelineCacheMax" class="_modified">{{ i18n.ts.modified }}</span></template>
						</MkInput>

						<MkInput v-model="fttForm.state.perUserListTimelineCacheMax" type="number">
							<template #label>perUserListTimelineCacheMax<span v-if="fttForm.modifiedStates.perUserListTimelineCacheMax" class="_modified">{{ i18n.ts.modified }}</span></template>
						</MkInput>
					</template>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="true">
				<template #icon><i class="ti ti-bolt"></i></template>
				<template #label>Misskey® Reactions Boost Technology™ (RBT)<span class="_beta">{{ i18n.ts.beta }}</span></template>
				<template v-if="rbtForm.savedState.enableReactionsBuffering" #suffix>Enabled</template>
				<template v-else #suffix>Disabled</template>
				<template v-if="rbtForm.modified.value" #footer>
					<MkFormFooter :form="rbtForm"/>
				</template>

				<div class="_gaps_m">
					<MkSwitch v-model="rbtForm.state.enableReactionsBuffering">
						<template #label>{{ i18n.ts.enable }}<span v-if="rbtForm.modifiedStates.enableReactionsBuffering" class="_modified">{{ i18n.ts.modified }}</span></template>
						<template #caption>{{ i18n.ts._serverSettings.reactionsBufferingDescription }}</template>
					</MkSwitch>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="true">
				<template #icon><i class="ti ti-recycle"></i></template>
				<template #label>Remote Notes Cleaning (仮)</template>
				<template v-if="remoteNotesCleaningForm.savedState.enableRemoteNotesCleaning" #suffix>Enabled</template>
				<template v-else #suffix>Disabled</template>
				<template v-if="remoteNotesCleaningForm.modified.value" #footer>
					<MkFormFooter :form="remoteNotesCleaningForm"/>
				</template>

				<div class="_gaps_m">
					<MkSwitch v-model="remoteNotesCleaningForm.state.enableRemoteNotesCleaning">
						<template #label>{{ i18n.ts.enable }}<span v-if="remoteNotesCleaningForm.modifiedStates.enableRemoteNotesCleaning" class="_modified">{{ i18n.ts.modified }}</span></template>
						<template #caption>{{ i18n.ts._serverSettings.remoteNotesCleaning_description }}</template>
					</MkSwitch>

					<template v-if="remoteNotesCleaningForm.state.enableRemoteNotesCleaning">
						<MkInput v-model="remoteNotesCleaningForm.state.remoteNotesCleaningExpiryDaysForEachNotes" type="number">
							<template #label>{{ i18n.ts._serverSettings.remoteNotesCleaningExpiryDaysForEachNotes }} ({{ i18n.ts.inDays }})<span v-if="remoteNotesCleaningForm.modifiedStates.remoteNotesCleaningExpiryDaysForEachNotes" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #suffix>{{ i18n.ts._time.day }}</template>
						</MkInput>

						<MkInput v-model="remoteNotesCleaningForm.state.remoteNotesCleaningMaxProcessingDurationInMinutes" type="number">
							<template #label>{{ i18n.ts._serverSettings.remoteNotesCleaningMaxProcessingDuration }} ({{ i18n.ts.inMinutes }})<span v-if="remoteNotesCleaningForm.modifiedStates.remoteNotesCleaningMaxProcessingDurationInMinutes" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #suffix>{{ i18n.ts._time.minute }}</template>
						</MkInput>
					</template>
				</div>
			</MkFolder>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInput from '@/components/MkInput.vue';
import MkLink from '@/components/MkLink.vue';
import { useForm } from '@/composables/use-form.js';
import MkFormFooter from '@/components/MkFormFooter.vue';

const meta = await misskeyApi('admin/meta');

const enableServerMachineStats = ref(meta.enableServerMachineStats);
const enableIdenticonGeneration = ref(meta.enableIdenticonGeneration);
const enableChartsForRemoteUser = ref(meta.enableChartsForRemoteUser);
const enableStatsForFederatedInstances = ref(meta.enableStatsForFederatedInstances);
const enableChartsForFederatedInstances = ref(meta.enableChartsForFederatedInstances);

function onChange_enableServerMachineStats(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableServerMachineStats: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableIdenticonGeneration(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableIdenticonGeneration: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableChartsForRemoteUser(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableChartsForRemoteUser: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableStatsForFederatedInstances(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableStatsForFederatedInstances: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableChartsForFederatedInstances(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableChartsForFederatedInstances: value,
	}).then(() => {
		fetchInstance(true);
	});
}

const fttForm = useForm({
	enableFanoutTimeline: meta.enableFanoutTimeline,
	enableFanoutTimelineDbFallback: meta.enableFanoutTimelineDbFallback,
	perLocalUserUserTimelineCacheMax: meta.perLocalUserUserTimelineCacheMax,
	perRemoteUserUserTimelineCacheMax: meta.perRemoteUserUserTimelineCacheMax,
	perUserHomeTimelineCacheMax: meta.perUserHomeTimelineCacheMax,
	perUserListTimelineCacheMax: meta.perUserListTimelineCacheMax,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableFanoutTimeline: state.enableFanoutTimeline,
		enableFanoutTimelineDbFallback: state.enableFanoutTimelineDbFallback,
		perLocalUserUserTimelineCacheMax: state.perLocalUserUserTimelineCacheMax,
		perRemoteUserUserTimelineCacheMax: state.perRemoteUserUserTimelineCacheMax,
		perUserHomeTimelineCacheMax: state.perUserHomeTimelineCacheMax,
		perUserListTimelineCacheMax: state.perUserListTimelineCacheMax,
	});
	fetchInstance(true);
});

const rbtForm = useForm({
	enableReactionsBuffering: meta.enableReactionsBuffering,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableReactionsBuffering: state.enableReactionsBuffering,
	});
	fetchInstance(true);
});

const remoteNotesCleaningForm = useForm({
	enableRemoteNotesCleaning: meta.enableRemoteNotesCleaning,
	remoteNotesCleaningExpiryDaysForEachNotes: meta.remoteNotesCleaningExpiryDaysForEachNotes,
	remoteNotesCleaningMaxProcessingDurationInMinutes: meta.remoteNotesCleaningMaxProcessingDurationInMinutes,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableRemoteNotesCleaning: state.enableRemoteNotesCleaning,
		remoteNotesCleaningExpiryDaysForEachNotes: state.remoteNotesCleaningExpiryDaysForEachNotes,
		remoteNotesCleaningMaxProcessingDurationInMinutes: state.remoteNotesCleaningMaxProcessingDurationInMinutes,
	});
	fetchInstance(true);
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.other,
	icon: 'ti ti-adjustments',
}));
</script>
