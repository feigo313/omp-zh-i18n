import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { createI18n, type I18nManager } from "../src/i18n";

describe("i18n", () => {
	let tempDir: string;
	const originalEnv = process.env.OMP_LANG;

	beforeEach(async () => {
		// 创建临时目录用于测试翻译文件
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "i18n-test-"));
		// 设置环境变量
		process.env.OMP_LANG = "zh";
	});

	afterEach(async () => {
		// 清理临时目录
		await fs.rm(tempDir, { recursive: true, force: true });
		// 恢复环境变量
		if (originalEnv !== undefined) {
			process.env.OMP_LANG = originalEnv;
		} else {
			delete process.env.OMP_LANG;
		}
	});

	describe("加载翻译文件", () => {
		it("从多个 JSON 文件加载并合并翻译", async () => {
			await fs.writeFile(
				path.join(tempDir, "zh-ui.json"),
				JSON.stringify({
					meta: { version: "1.0.0" },
					"button.save": "保存",
					"button.cancel": "取消",
				}),
			);
			await fs.writeFile(
				path.join(tempDir, "zh-messages.json"),
				JSON.stringify({
					"message.success": "操作成功",
					"message.error": "操作失败",
				}),
			);

			const i18n = createI18n(tempDir);
			await i18n.init();

			expect(i18n.t("button.save")).toBe("保存");
			expect(i18n.t("button.cancel")).toBe("取消");
			expect(i18n.t("message.success")).toBe("操作成功");
		});

		it("处理嵌套的翻译结构", async () => {
			await fs.writeFile(
				path.join(tempDir, "zh-nested.json"),
				JSON.stringify({
					settings: {
						theme: {
							dark: {
								label: "深色主题",
								description: "使用深色界面",
							},
						},
					},
				}),
			);

			const i18n = createI18n(tempDir);
			await i18n.init();

			expect(i18n.t("settings.theme.dark.label")).toBe("深色主题");
			expect(i18n.t("settings.theme.dark.description")).toBe("使用深色界面");
		});

		it("跳过无效的 JSON 文件", async () => {
			await fs.writeFile(path.join(tempDir, "zh-valid.json"), JSON.stringify({ key: "值" }));
			await fs.writeFile(path.join(tempDir, "zh-invalid.json"), "{ invalid json }");

			const i18n = createI18n(tempDir);
			await i18n.init();

			expect(i18n.t("key")).toBe("值");
		});

		it("跳过非 JSON 文件", async () => {
			await fs.writeFile(path.join(tempDir, "zh-valid.json"), JSON.stringify({ key: "值" }));
			await fs.writeFile(path.join(tempDir, "zh-readme.txt"), "这不是 JSON");

			const i18n = createI18n(tempDir);
			await i18n.init();

			expect(i18n.t("key")).toBe("值");
		});
	});

	describe("翻译查找", () => {
		let i18n: I18nManager;

		beforeEach(async () => {
			await fs.writeFile(
				path.join(tempDir, "zh-test.json"),
				JSON.stringify({
					"simple.key": "简单键",
					"with.param": "带 {name} 的键",
					"multiple.params": "{greeting}，{name}！",
				}),
			);

			i18n = createI18n(tempDir);
			await i18n.init();
		});

		it("返回找到的翻译", () => {
			expect(i18n.t("simple.key")).toBe("简单键");
		});

		it("缺失键时返回 fallback", () => {
			expect(i18n.t("missing.key", "默认值")).toBe("默认值");
		});

		it("缺失键且无 fallback 时返回键名", () => {
			expect(i18n.t("missing.key")).toBe("missing.key");
		});

		it("支持单个参数插值", () => {
			expect(i18n.t("with.param", undefined, { name: "参数" })).toBe("带 参数 的键");
		});

		it("支持多个参数插值", () => {
			expect(i18n.t("multiple.params", undefined, { greeting: "你好", name: "世界" })).toBe("你好，世界！");
		});

		it("保留未提供的参数占位符", () => {
			expect(i18n.t("multiple.params", undefined, { greeting: "你好" })).toBe("你好，{name}！");
		});

		it("检查翻译是否存在", () => {
			expect(i18n.has("simple.key")).toBe(true);
			expect(i18n.has("missing.key")).toBe(false);
		});
	});

	describe("fallback 语言机制", () => {
		it("当前语言缺失时返回 key", async () => {
			await fs.writeFile(path.join(tempDir, "zh-partial.json"), JSON.stringify({ "only.in.zh": "仅中文" }));

			const i18n = createI18n(tempDir);
			await i18n.init();

			expect(i18n.t("only.in.zh")).toBe("仅中文");
			expect(i18n.t("only.in.en")).toBe("only.in.en");
		});

		it("两种语言都没有时返回 key", async () => {
			await fs.writeFile(path.join(tempDir, "zh-test.json"), JSON.stringify({ "existing.key": "存在的键" }));

			const i18n = createI18n(tempDir);
			await i18n.init();

			expect(i18n.t("missing.key")).toBe("missing.key");
			expect(i18n.t("missing.key", "fallback")).toBe("fallback");
		});
	});

	describe("语言切换", () => {
		it("运行时切换语言", async () => {
			await fs.writeFile(path.join(tempDir, "zh-test.json"), JSON.stringify({ key: "中文" }));
			await fs.writeFile(path.join(tempDir, "en-test.json"), JSON.stringify({ key: "English" }));

			const i18n = createI18n(tempDir);
			await i18n.init();

			expect(i18n.t("key")).toBe("中文");
			expect(i18n.getLanguage()).toBe("zh");

			process.env.OMP_LANG = "en";
			await i18n.setLanguage("en");

			expect(i18n.t("key")).toBe("English");
			expect(i18n.getLanguage()).toBe("en");
		});
	});

	describe("元数据", () => {
		it("获取翻译元数据", async () => {
			await fs.writeFile(
				path.join(tempDir, "zh-meta.json"),
				JSON.stringify({
					meta: {
						version: "1.2.3",
						completeness: 85,
						lastUpdated: "2026-06-28",
					},
				}),
			);

			const i18n = createI18n(tempDir);
			await i18n.init();

			const meta = i18n.getMeta();
			expect(meta?.version).toBe("1.2.3");
			expect(meta?.completeness).toBe(85);
			expect(meta?.lastUpdated).toBe("2026-06-28");
		});
	});

	describe("边界情况", () => {
		it("处理空文件", async () => {
			await fs.writeFile(path.join(tempDir, "zh-empty.json"), "");

			const i18n = createI18n(tempDir);
			await i18n.init();

			// 应该正常初始化，不会崩溃
			expect(i18n.getLanguage()).toBe("zh");
		});

		it("处理目录不存在的情况", async () => {
			await fs.rm(tempDir, { recursive: true, force: true });

			const i18n = createI18n(tempDir);
			await i18n.init();

			// 应该正常初始化，不会崩溃
			expect(i18n.getLanguage()).toBeDefined();
		});

		it("处理嵌套结构中的 null 值", async () => {
			await fs.writeFile(
				path.join(tempDir, "zh-null.json"),
				JSON.stringify({
					nested: {
						value: null,
						valid: "有效值",
					},
				}),
			);

			const i18n = createI18n(tempDir);
			await i18n.init();

			expect(i18n.t("nested.value")).toBe("nested.value");
			expect(i18n.t("nested.valid")).toBe("有效值");
		});

		it("未初始化时 t() 返回 fallback", () => {
			const i18n = createI18n(tempDir);

			// 未调用 init()，直接调用 t()
			expect(i18n.t("key")).toBe("key");
			expect(i18n.t("key", "fallback")).toBe("fallback");
		});

		it("reset 方法重置实例状态", async () => {
			await fs.writeFile(path.join(tempDir, "zh-test.json"), JSON.stringify({ key: "值" }));

			const i18n = createI18n(tempDir);
			await i18n.init();

			expect(i18n.t("key")).toBe("值");

			i18n.reset();

			// 重置后未初始化，应该返回 key
			expect(i18n.t("key")).toBe("key");
		});
	});
});
