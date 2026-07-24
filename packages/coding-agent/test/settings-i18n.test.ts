import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { i18n } from "../src/i18n";

describe("settings i18n integration", () => {
	let tempDir: string;
	let originalLang: string | undefined;

	beforeEach(async () => {
		tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "settings-i18n-test-"));
		originalLang = process.env.OMP_LANG;
		process.env.OMP_LANG = "zh";
	});

	afterEach(async () => {
		if (originalLang !== undefined) {
			process.env.OMP_LANG = originalLang;
		} else {
			delete process.env.OMP_LANG;
		}
		// Reset i18n singleton to prevent state leakage between tests
		i18n.reset();
		await fs.promises.rm(tempDir, { recursive: true, force: true });
	});

	test("i18n.language setting exists in schema", async () => {
		const { SETTINGS_SCHEMA } = await import("../src/config/settings-schema");
		const setting = (SETTINGS_SCHEMA as Record<string, unknown>)["i18n.language"];
		expect(setting).toBeDefined();
		expect((setting as { type: string }).type).toBe("string");
		expect((setting as { default: string }).default).toBe("en");
	});

	test("i18n.language setting has correct UI metadata", async () => {
		const { getUi } = await import("../src/config/settings-schema");
		const ui = getUi("i18n.language");
		expect(ui).toBeDefined();
		expect(ui?.tab).toBe("interaction");
		expect(ui?.group).toBe("General");
		expect(ui?.label).toBe("Language");
		expect(ui?.description).toBe("UI language (applies on next screen refresh)");
	});

	test("TAB_METADATA has all required tabs", async () => {
		const { TAB_METADATA } = await import("../src/config/settings-schema");
		const requiredTabs = [
			"appearance",
			"model",
			"interaction",
			"context",
			"memory",
			"files",
			"shell",
			"tools",
			"tasks",
			"providers",
		];
		for (const tab of requiredTabs) {
			expect(TAB_METADATA[tab as keyof typeof TAB_METADATA]).toBeDefined();
			expect(TAB_METADATA[tab as keyof typeof TAB_METADATA].label).toBeTypeOf("string");
		}
	});

	test("TAB_GROUPS has General group in interaction tab", async () => {
		const { TAB_GROUPS } = await import("../src/config/settings-schema");
		expect(TAB_GROUPS.interaction).toContain("General");
	});

	test("getTabLabel returns translated label when translation exists", async () => {
		// Create a translation file
		const translations = {
			"tabs.appearance.label": "外观",
			"tabs.model.label": "模型",
			"tabs.interaction.label": "交互",
		};
		await fs.promises.writeFile(path.join(tempDir, "zh-ui.json"), JSON.stringify(translations));

		// Initialize i18n with temp dir
		i18n.reset(tempDir);
		await i18n.init();

		const { interceptTabLabel } = await import("../src/i18n/interceptor");

		expect(interceptTabLabel("appearance", "Appearance")).toBe("外观");
		expect(interceptTabLabel("model", "Model")).toBe("模型");
		expect(interceptTabLabel("interaction", "Interaction")).toBe("交互");
	});

	test("getTabLabel falls back to English when no translation", async () => {
		// Create empty translation file
		await fs.promises.writeFile(path.join(tempDir, "zh-ui.json"), JSON.stringify({}));

		i18n.reset(tempDir);
		await i18n.init();

		const { interceptTabLabel } = await import("../src/i18n/interceptor");

		// No translation for these, should fall back to English
		expect(interceptTabLabel("appearance", "Appearance")).toBe("Appearance");
		expect(interceptTabLabel("context", "Context")).toBe("Context");
	});

	test("getGroupLabel returns translated group when translation exists", async () => {
		const translations = {
			"tabs.interaction.groups.General": "常规",
			"tabs.interaction.groups.Input": "输入",
			"tabs.appearance.groups.Theme": "主题",
		};
		await fs.promises.writeFile(path.join(tempDir, "zh-groups.json"), JSON.stringify(translations));

		i18n.reset(tempDir);
		await i18n.init();

		const { interceptGroupLabel } = await import("../src/i18n/interceptor");

		expect(interceptGroupLabel("interaction", "General")).toBe("常规");
		expect(interceptGroupLabel("interaction", "Input")).toBe("输入");
		expect(interceptGroupLabel("appearance", "Theme")).toBe("主题");
	});

	test("getGroupLabel falls back to English when no translation", async () => {
		await fs.promises.writeFile(path.join(tempDir, "zh-groups.json"), JSON.stringify({}));

		i18n.reset(tempDir);
		await i18n.init();

		const { interceptGroupLabel } = await import("../src/i18n/interceptor");

		expect(interceptGroupLabel("interaction", "General")).toBe("General");
		expect(interceptGroupLabel("interaction", "Input")).toBe("Input");
	});

	test("getAllSettingDefs translates labels and descriptions", async () => {
		const translations = {
			"settings.theme.dark.label": "深色主题",
			"settings.theme.dark.description": "深色模式下使用的主题",
		};
		await fs.promises.writeFile(path.join(tempDir, "zh-settings.json"), JSON.stringify(translations));

		i18n.reset(tempDir);
		await i18n.init();

		const { getAllSettingDefs } = await import("../src/modes/components/settings-defs");
		const defs = getAllSettingDefs();
		const themeDarkDef = defs.find(d => d.path === "theme.dark");

		expect(themeDarkDef).toBeDefined();
		expect(themeDarkDef?.label).toBe("深色主题");
		expect(themeDarkDef?.description).toBe("深色模式下使用的主题");
	});

	test("getAllSettingDefs falls back to English when no translation", async () => {
		await fs.promises.writeFile(path.join(tempDir, "zh-settings.json"), JSON.stringify({}));

		i18n.reset(tempDir);
		await i18n.init();

		// Must import and call the cache invalidation function since the previous test
		// cached Chinese translations at module level
		const { getAllSettingDefs, invalidateSettingDefsCache } = await import("../src/modes/components/settings-defs");
		invalidateSettingDefsCache();

		const defs = getAllSettingDefs();
		const themeDarkDef = defs.find(d => d.path === "theme.dark");

		expect(themeDarkDef).toBeDefined();
		expect(themeDarkDef?.label).toBe("Dark Theme");
		expect(themeDarkDef?.description).toBe("Theme used when the terminal has a dark background");
	});

	test("i18n.language setting is included in interaction tab", async () => {
		await fs.promises.writeFile(path.join(tempDir, "zh-settings.json"), JSON.stringify({}));

		i18n.reset(tempDir);
		await i18n.init();

		const { getSettingsForTab } = await import("../src/modes/components/settings-defs");
		const interactionSettings = getSettingsForTab("interaction");
		const langSetting = interactionSettings.find(s => s.path === "i18n.language");

		expect(langSetting).toBeDefined();
		expect(langSetting?.tab).toBe("interaction");
		expect(langSetting?.group).toBe("General");
	});
});
