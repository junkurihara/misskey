<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.tabs">
	<div :class="$style.tabsInner">
		<button
			v-for="t in tabs" :ref="(el) => tabRefs[t.key] = (el as HTMLElement)" v-tooltip.noDelay="t.title"
			class="_button" :class="[$style.tab, { [$style.active]: t.key != null && t.key === props.tab, [$style.animate]: prefer.s.animation }]"
			@mousedown="(ev) => onTabMousedown(t, ev)" @click="(ev) => onTabClick(t, ev)"
		>
			<div :class="$style.tabInner">
				<i v-if="t.icon" :class="[$style.tabIcon, t.icon]"></i>
				<div
					v-if="!t.iconOnly || (!prefer.s.animation && t.key === tab)"
					:class="$style.tabTitle"
				>
					{{ t.title }}
				</div>
				<Transition
					v-else mode="in-out" @enter="enter" @afterEnter="afterEnter" @leave="leave"
					@afterLeave="afterLeave"
				>
					<div v-show="t.key === tab" :class="[$style.tabTitle, $style.animate]">{{ t.title }}</div>
				</Transition>
			</div>
		</button>
	</div>
	<div
		ref="tabHighlightEl"
		:class="[$style.tabHighlight, { [$style.animate]: prefer.s.animation }]"
	></div>
</div>
</template>

<script lang="ts">
export type Tab = {
	key: string;
	onClick?: (ev: MouseEvent) => void;
} & (
	| {
		iconOnly?: false;
		title: string;
		icon?: string;
	}
	| {
		iconOnly: true;
		icon: string;
	}
);
</script>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue';
import { prefer } from '@/preferences.js';

const props = withDefaults(defineProps<{
	tabs?: Tab[];
	tab?: string;
}>(), {
	tabs: () => ([] as Tab[]),
});

const emit = defineEmits<{
	(ev: 'update:tab', key: string);
	(ev: 'tabClick', key: string);
}>();

const tabHighlightEl = useTemplateRef('tabHighlightEl');
const tabRefs: Record<string, HTMLElement | null> = {};

function onTabMousedown(tab: Tab, ev: MouseEvent): void {
	// ユーザビリティの観点からmousedown時にはonClickは呼ばない
	if (tab.key) {
		emit('update:tab', tab.key);
	}
}

function onTabClick(t: Tab, ev: MouseEvent): void {
	emit('tabClick', t.key);

	if (t.onClick) {
		ev.preventDefault();
		ev.stopPropagation();
		t.onClick(ev);
	}

	if (t.key) {
		emit('update:tab', t.key);
	}
}

function renderTab() {
	const tabEl = props.tab ? tabRefs[props.tab] : undefined;
	if (tabEl && tabHighlightEl.value && tabHighlightEl.value.parentElement) {
		// offsetWidth や offsetLeft は少数を丸めてしまうため getBoundingClientRect を使う必要がある
		// https://developer.mozilla.org/ja/docs/Web/API/HTMLElement/offsetWidth#%E5%80%A4
		const parentRect = tabHighlightEl.value.parentElement.getBoundingClientRect();
		const rect = tabEl.getBoundingClientRect();
		tabHighlightEl.value.style.width = rect.width + 'px';
		tabHighlightEl.value.style.left = (rect.left - parentRect.left + tabHighlightEl.value.parentElement.scrollLeft) + 'px';
	}
}

let entering = false;

async function enter(el: Element) {
	if (!(el instanceof HTMLElement)) return;
	entering = true;
	const elementWidth = el.getBoundingClientRect().width;
	el.style.width = '0';
	el.style.paddingLeft = '0';
	el.offsetWidth; // reflow
	el.style.width = `${elementWidth}px`;
	el.style.paddingLeft = '';
	nextTick(() => {
		entering = false;
	});

	window.setTimeout(renderTab, 170);
}

function afterEnter(el: Element) {
	if (!(el instanceof HTMLElement)) return;
	// element.style.width = '';
}

async function leave(el: Element) {
	if (!(el instanceof HTMLElement)) return;
	const elementWidth = el.getBoundingClientRect().width;
	el.style.width = `${elementWidth}px`;
	el.style.paddingLeft = '';
	el.offsetWidth; // reflow
	el.style.width = '0';
	el.style.paddingLeft = '0';
}

function afterLeave(el: Element) {
	if (!(el instanceof HTMLElement)) return;
	el.style.width = '';
}

onMounted(() => {
	watch([() => props.tab, () => props.tabs], () => {
		nextTick(() => {
			if (entering) return;
			renderTab();
		});
	}, {
		immediate: true,
	});
});

onUnmounted(() => {
});
</script>

<style lang="scss" module>
.tabs {
	--height: 40px;

	display: block;
	position: relative;
	margin: 0;
	height: var(--height);
	font-size: 85%;
	overflow-x: auto;
	overflow-y: hidden;
	scrollbar-width: none;
}

.tabsInner {
	display: inline-block;
	height: var(--height);
	white-space: nowrap;
}

.tab {
	display: inline-block;
	position: relative;
	padding: 0 10px;
	height: 100%;
	font-weight: normal;
	opacity: 0.7;

	&:hover {
		opacity: 1;
	}

	&.active {
		opacity: 1;
	}

	&.animate {
		transition: opacity 0.2s ease;
	}
}

.tabInner {
	display: flex;
	align-items: center;
}

.tabIcon + .tabTitle {
	padding-left: 4px;
}

.tabTitle {
	overflow: hidden;

	&.animate {
		transition: width .15s linear, padding-left .15s linear;
	}
}

.tabHighlight {
	position: absolute;
	bottom: 0;
	height: 3px;
	background: var(--MI_THEME-accent);
	border-radius: 999px;
	transition: none;
	pointer-events: none;

	&.animate {
		transition: width 0.15s ease, left 0.15s ease;
	}
}
</style>
