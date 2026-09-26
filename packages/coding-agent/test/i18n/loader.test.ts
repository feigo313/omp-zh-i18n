import { afterEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { createI18n } from "../../src/i18n";

const originalLanguage = process.env.OMP_LANG;

afterEach(() => {
	if (originalLanguage === undefined) delete process.env.OMP_LANG;
	else process.env.OMP_LANG = originalLanguage;
});

async function createLanguageDir(files: Record<string, unknown>): Promise<string> {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), "omp-i18n-"));
	for (const [name, content] of Object.entries(files)) {
		await fs.writeFile(path.join(dir, name), JSON.stringify(content), "utf8");
	}
	return dir;
}

describe("i18n directory loading", () => {
	it("loads the base language file and sorted split files", async () => {
		const dir = await createLanguageDir({
			"zh.json": { meta: { version: "test" }, ui: { base: "基础" } },
			"zh-ui.json": { ui: { loading: "加载中" } },
			"zh-a.json": { shared: "first" },
			"zh-b.json": { shared: "second" },
		});
		try {
			const i18n = createI18n(dir);
			await i18n.setLanguage("zh");
			expect(i18n.getLanguage()).toBe("zh");
			expect(i18n.t("ui.base")).toBe("基础");
			expect(i18n.t("ui.loading")).toBe("加载中");
			expect(i18n.t("shared")).toBe("second");
			expect(i18n.getMeta()?.version).toBe("test");
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	it("falls back to English for an unsupported language instead of loading an empty dictionary", async () => {
		const dir = await createLanguageDir({ "zh.json": { ui: { loading: "加载中" } } });
		try {
			const i18n = createI18n(dir);
			await i18n.setLanguage("fr");
			expect(i18n.getLanguage()).toBe("en");
			expect(i18n.t("ui.loading", "Loading...")).toBe("Loading...");
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	it("uses the environment language during initialization", async () => {
		const dir = await createLanguageDir({
			"zh.json": { ui: { loading: "加载中" } },
			"en.json": { ui: { loading: "Loading..." } },
		});
		process.env.OMP_LANG = "zh";
		try {
			const i18n = createI18n(dir);
			await i18n.init();
			expect(i18n.t("ui.loading")).toBe("加载中");
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	it("interpolates fallback text before initialization", () => {
		const i18n = createI18n("G:/does-not-exist");
		expect(i18n.t("cli.test", "Hello {name}", { name: "world" })).toBe("Hello world");
	});

	// A stale `~/.omp/lang` override whose values are all empty used to blank
	// every bundled translation it named, so the whole settings overlay rendered
	// label-less rows. An empty override is never more useful than what it
	// overrides, so it must not win.
	it("does not let an empty override blank an existing translation", async () => {
		const dir = await createLanguageDir({
			"zh.json": { "settings.darkTheme.label": "深色主题", "ui.loading": "加载中" },
			"zh-empty-override.json": { "settings.darkTheme.label": "" },
		});
		try {
			const i18n = createI18n(dir);
			await i18n.setLanguage("zh");
			expect(i18n.t("settings.darkTheme.label", "Dark Theme")).toBe("深色主题");
			// A key the override does not mention still resolves normally.
			expect(i18n.t("ui.loading", "Loading")).toBe("加载中");
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	it("still lets a later file replace a translation with a real value", async () => {
		const dir = await createLanguageDir({
			"zh-a.json": { "settings.darkTheme.label": "深色主题" },
			// Sorts after zh-a.json, so this is the later (winning) value.
			"zh-b.json": { "settings.darkTheme.label": "暗色主题" },
		});
		try {
			const i18n = createI18n(dir);
			await i18n.setLanguage("zh");
			expect(i18n.t("settings.darkTheme.label", "Dark Theme")).toBe("暗色主题");
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});
});
