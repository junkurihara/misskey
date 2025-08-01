/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, watch, version as vueVersion } from 'vue';
import { compareVersions } from 'compare-versions';
import { version, lang, updateLocale, locale, apiUrl, isSafeMode } from '@@/js/config.js';
import defaultLightTheme from '@@/themes/l-light.json5';
import defaultDarkTheme from '@@/themes/d-green-lime.json5';
import type { App } from 'vue';
import widgets from '@/widgets/index.js';
import directives from '@/directives/index.js';
import components from '@/components/index.js';
import { applyTheme } from '@/theme.js';
import { isDeviceDarkmode } from '@/utility/is-device-darkmode.js';
import { updateI18n, i18n } from '@/i18n.js';
import { refreshCurrentAccount, login } from '@/accounts.js';
import { store } from '@/store.js';
import { fetchInstance, instance } from '@/instance.js';
import { deviceKind, updateDeviceKind } from '@/utility/device-kind.js';
import { reloadChannel } from '@/utility/unison-reload.js';
import { getUrlWithoutLoginId } from '@/utility/login-id.js';
import { getAccountFromId } from '@/utility/get-account-from-id.js';
import { deckStore } from '@/ui/deck/deck-store.js';
import { analytics, initAnalytics } from '@/analytics.js';
import { miLocalStorage } from '@/local-storage.js';
import { fetchCustomEmojis } from '@/custom-emojis.js';
import { prefer } from '@/preferences.js';
import { $i } from '@/i.js';

export async function common(createVue: () => Promise<App<Element>>) {
	console.info(`Misskey v${version}`);

	if (_DEV_) {
		console.warn('Development mode!!!');

		console.info(`vue ${vueVersion}`);

		window.addEventListener('error', event => {
			console.error(event);
			/*
			alert({
				type: 'error',
				title: 'DEV: Unhandled error',
				text: event.message
			});
			*/
		});

		window.addEventListener('unhandledrejection', event => {
			console.error(event);
			/*
			alert({
				type: 'error',
				title: 'DEV: Unhandled promise rejection',
				text: event.reason
			});
			*/
		});
	}

	let isClientUpdated = false;

	//#region クライアントが更新されたかチェック
	const lastVersion = miLocalStorage.getItem('lastVersion');
	if (lastVersion !== version) {
		miLocalStorage.setItem('lastVersion', version);

		// テーマリビルドするため
		miLocalStorage.removeItem('theme');

		try { // 変なバージョン文字列来るとcompareVersionsでエラーになるため
			if (lastVersion != null && compareVersions(version, lastVersion) === 1) {
				isClientUpdated = true;
			}
		} catch (err) { /* empty */ }
	}
	//#endregion

	//#region Detect language & fetch translations
	const localeVersion = miLocalStorage.getItem('localeVersion');
	const localeOutdated = (localeVersion == null || localeVersion !== version || locale == null);

	async function fetchAndUpdateLocale({ useCache } = { useCache: true }) {
		const fetchOptions: RequestInit | undefined = useCache ? undefined : { cache: 'no-store' };
		const res = await window.fetch(`/assets/locales/${lang}.${version}.json`, fetchOptions);
		if (res.status === 200) {
			const newLocale = await res.text();
			const parsedNewLocale = JSON.parse(newLocale);
			miLocalStorage.setItem('locale', newLocale);
			miLocalStorage.setItem('localeVersion', version);
			updateLocale(parsedNewLocale);
			updateI18n(parsedNewLocale);
		}
	}

	if (localeOutdated) {
		fetchAndUpdateLocale();
	}

	if (import.meta.hot) {
		import.meta.hot.on('locale-update', async (updatedLang: string) => {
			console.info(`Locale updated: ${updatedLang}`);
			if (updatedLang === lang) {
				await new Promise(resolve => {
					window.setTimeout(resolve, 500);
				});
				await fetchAndUpdateLocale({ useCache: false });
				window.location.reload();
			}
		});
	}
	//#endregion

	// タッチデバイスでCSSの:hoverを機能させる
	window.document.addEventListener('touchend', () => {}, { passive: true });

	// URLに#pswpを含む場合は取り除く
	if (window.location.hash === '#pswp') {
		window.history.replaceState(null, '', window.location.href.replace('#pswp', ''));
	}

	// 一斉リロード
	reloadChannel.addEventListener('message', path => {
		if (path !== null) window.location.href = path;
		else window.location.reload();
	});

	// If mobile, insert the viewport meta tag
	if (['smartphone', 'tablet'].includes(deviceKind)) {
		const viewport = window.document.getElementsByName('viewport').item(0);
		viewport.setAttribute('content',
			`${viewport.getAttribute('content')}, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`);
	}

	//#region Set lang attr
	const html = window.document.documentElement;
	html.setAttribute('lang', lang);
	//#endregion

	await store.ready;
	await deckStore.ready;

	const fetchInstanceMetaPromise = fetchInstance();

	fetchInstanceMetaPromise.then(() => {
		miLocalStorage.setItem('v', instance.version);
	});

	//#region loginId
	const params = new URLSearchParams(window.location.search);
	const loginId = params.get('loginId');

	if (loginId) {
		const target = getUrlWithoutLoginId(window.location.href);

		if (!$i || $i.id !== loginId) {
			const account = await getAccountFromId(loginId);
			if (account) {
				await login(account.token, target);
			}
		}

		window.history.replaceState({ misskey: 'loginId' }, '', target);
	}
	//#endregion

	// NOTE: この処理は必ずクライアント更新チェック処理より後に来ること(テーマ再構築のため)
	watch(store.r.darkMode, (darkMode) => {
		const theme = (() => {
			if (darkMode) {
				return isSafeMode ? defaultDarkTheme : (prefer.s.darkTheme ?? defaultDarkTheme);
			} else {
				return isSafeMode ? defaultLightTheme : (prefer.s.lightTheme ?? defaultLightTheme);
			}
		})();

		applyTheme(theme);
	}, { immediate: isSafeMode || miLocalStorage.getItem('theme') == null });

	window.document.documentElement.dataset.colorScheme = store.s.darkMode ? 'dark' : 'light';

	if (!isSafeMode) {
		const darkTheme = prefer.model('darkTheme');
		const lightTheme = prefer.model('lightTheme');

		watch(darkTheme, (theme) => {
			if (store.s.darkMode) {
				applyTheme(theme ?? defaultDarkTheme);
			}
		});

		watch(lightTheme, (theme) => {
			if (!store.s.darkMode) {
				applyTheme(theme ?? defaultLightTheme);
			}
		});
	}

	//#region Sync dark mode
	if (prefer.s.syncDeviceDarkMode) {
		store.set('darkMode', isDeviceDarkmode());
	}

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (mql) => {
		if (prefer.s.syncDeviceDarkMode) {
			store.set('darkMode', mql.matches);
		}
	});
	//#endregion

	if (!isSafeMode) {
		if (prefer.s.darkTheme && store.s.darkMode) {
			if (miLocalStorage.getItem('themeId') !== prefer.s.darkTheme.id) applyTheme(prefer.s.darkTheme);
		} else if (prefer.s.lightTheme && !store.s.darkMode) {
			if (miLocalStorage.getItem('themeId') !== prefer.s.lightTheme.id) applyTheme(prefer.s.lightTheme);
		}

		fetchInstanceMetaPromise.then(() => {
			// TODO: instance.defaultLightTheme/instance.defaultDarkThemeが不正な形式だった場合のケア
			if (prefer.s.lightTheme == null && instance.defaultLightTheme != null) prefer.commit('lightTheme', JSON.parse(instance.defaultLightTheme));
			if (prefer.s.darkTheme == null && instance.defaultDarkTheme != null) prefer.commit('darkTheme', JSON.parse(instance.defaultDarkTheme));
		});
	}

	watch(prefer.r.overridedDeviceKind, (kind) => {
		updateDeviceKind(kind);
	}, { immediate: true });

	watch(prefer.r.useBlurEffectForModal, v => {
		window.document.documentElement.style.setProperty('--MI-modalBgFilter', v ? 'blur(4px)' : 'none');
	}, { immediate: true });

	watch(prefer.r.useBlurEffect, v => {
		if (v) {
			window.document.documentElement.style.removeProperty('--MI-blur');
		} else {
			window.document.documentElement.style.setProperty('--MI-blur', 'none');
		}
	}, { immediate: true });

	// Keep screen on
	const onVisibilityChange = () => window.document.addEventListener('visibilitychange', () => {
		if (window.document.visibilityState === 'visible') {
			navigator.wakeLock.request('screen');
		}
	});
	if (prefer.s.keepScreenOn && 'wakeLock' in navigator) {
		navigator.wakeLock.request('screen')
			.then(onVisibilityChange)
			.catch(() => {
				// On WebKit-based browsers, user activation is required to send wake lock request
				// https://webkit.org/blog/13862/the-user-activation-api/
				window.document.addEventListener(
					'click',
					() => navigator.wakeLock.request('screen').then(onVisibilityChange),
					{ once: true },
				);
			});
	}

	if (prefer.s.makeEveryTextElementsSelectable) {
		window.document.documentElement.classList.add('forceSelectableAll');
	}

	//#region Fetch user
	if ($i && $i.token) {
		if (_DEV_) {
			console.log('account cache found. refreshing...');
		}

		refreshCurrentAccount();
	}
	//#endregion

	try {
		await fetchCustomEmojis();
	} catch (err) { /* empty */ }

	// analytics
	fetchInstanceMetaPromise.then(async () => {
		await initAnalytics(instance);

		if ($i) {
			analytics.identify($i.id);
		}

		analytics.page({
			path: window.location.pathname,
		});
	});

	const app = await createVue();

	if (_DEV_) {
		app.config.performance = true;
	}

	widgets(app);
	directives(app);
	components(app);

	// https://github.com/misskey-dev/misskey/pull/8575#issuecomment-1114239210
	// なぜか2回実行されることがあるため、mountするdivを1つに制限する
	const rootEl = ((): HTMLElement => {
		const MISSKEY_MOUNT_DIV_ID = 'misskey_app';

		const currentRoot = window.document.getElementById(MISSKEY_MOUNT_DIV_ID);

		if (currentRoot) {
			console.warn('multiple import detected');
			return currentRoot;
		}

		const root = window.document.createElement('div');
		root.id = MISSKEY_MOUNT_DIV_ID;
		window.document.body.appendChild(root);
		return root;
	})();

	if (instance.sentryForFrontend) {
		const Sentry = await import('@sentry/vue');
		Sentry.init({
			app,
			integrations: [
				...(instance.sentryForFrontend.vueIntegration !== undefined ? [
					Sentry.vueIntegration(instance.sentryForFrontend.vueIntegration ?? undefined),
				] : []),
				...(instance.sentryForFrontend.browserTracingIntegration !== undefined ? [
					Sentry.browserTracingIntegration(instance.sentryForFrontend.browserTracingIntegration ?? undefined),
				] : []),
				...(instance.sentryForFrontend.replayIntegration !== undefined ? [
					Sentry.replayIntegration(instance.sentryForFrontend.replayIntegration ?? undefined),
				] : []),
			],

			// Set tracesSampleRate to 1.0 to capture 100%
			tracesSampleRate: 1.0,

			// Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
			...(instance.sentryForFrontend.browserTracingIntegration !== undefined ? {
				tracePropagationTargets: [apiUrl],
			} : {}),

			// Capture Replay for 10% of all sessions,
			// plus for 100% of sessions with an error
			...(instance.sentryForFrontend.replayIntegration !== undefined ? {
				replaysSessionSampleRate: 0.1,
				replaysOnErrorSampleRate: 1.0,
			} : {}),

			...instance.sentryForFrontend.options,
		});
	}

	app.mount(rootEl);

	// boot.jsのやつを解除
	window.onerror = null;
	window.onunhandledrejection = null;

	removeSplash();

	//#region Self-XSS 対策メッセージ
	if (!_DEV_) {
		console.log(
			`%c${i18n.ts._selfXssPrevention.warning}`,
			'color: #f00; background-color: #ff0; font-size: 36px; padding: 4px;',
		);
		console.log(
			`%c${i18n.ts._selfXssPrevention.title}`,
			'color: #f00; font-weight: 900; font-family: "Hiragino Sans W9", "Hiragino Kaku Gothic ProN", sans-serif; font-size: 24px;',
		);
		console.log(
			`%c${i18n.ts._selfXssPrevention.description1}`,
			'font-size: 16px; font-weight: 700;',
		);
		console.log(
			`%c${i18n.ts._selfXssPrevention.description2}`,
			'font-size: 16px;',
			'font-size: 20px; font-weight: 700; color: #f00;',
		);
		console.log(i18n.tsx._selfXssPrevention.description3({ link: 'https://misskey-hub.net/docs/for-users/resources/self-xss/' }));
	}
	//#endregion

	return {
		isClientUpdated,
		lastVersion,
		app,
	};
}

function removeSplash() {
	const splash = window.document.getElementById('splash');
	if (splash) {
		splash.style.opacity = '0';
		splash.style.pointerEvents = 'none';

		// transitionendイベントが発火しない場合があるため
		window.setTimeout(() => {
			splash.remove();
		}, 1000);
	}
}
