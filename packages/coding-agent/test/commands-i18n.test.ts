/**
 * Tests for i18n integration in command help system
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { type CliConfig, Command, type CommandCtor, renderCommandHelp, renderRootHelp } from "@oh-my-pi/pi-utils/cli";

// Mock command for testing
class MockCommand extends Command {
	static description = "Mock command description";
	static examples = ["Example 1", "Example 2"];
	static flags = {
		model: {
			kind: "string" as const,
			description: "Model to use",
			char: "m",
		},
		verbose: {
			kind: "boolean" as const,
			description: "Enable verbose output",
			char: "v",
		},
	};
	static args = {
		file: {
			kind: "string" as const,
			description: "Input file path",
			required: true,
		},
	};

	async run(): Promise<void> {
		// Mock implementation
	}
}

// Mock hidden command (default command)
class DefaultCommand extends Command {
	static hidden = true;
	static description = "Default command";
	static flags = {
		help: {
			kind: "boolean" as const,
			description: "Show help",
		},
	};

	async run(): Promise<void> {
		// Mock implementation
	}
}

describe("Command Help i18n Integration", () => {
	let originalStdout: typeof process.stdout.write;
	let output: string[];

	beforeEach(() => {
		output = [];
		originalStdout = process.stdout.write;
		process.stdout.write = ((chunk: string) => {
			output.push(chunk);
			return true;
		}) as typeof process.stdout.write;
	});

	afterEach(() => {
		process.stdout.write = originalStdout;
	});

	describe("renderRootHelp", () => {
		test("renders without translator (backward compatibility)", () => {
			const config: CliConfig = {
				bin: "test-cli",
				version: "1.0.0",
				commands: new Map([
					["mock", MockCommand as unknown as CommandCtor],
					["default", DefaultCommand as unknown as CommandCtor],
				]),
			};

			renderRootHelp(config);

			const outputText = output.join("");
			expect(outputText).toContain("test-cli v1.0.0");
			expect(outputText).toContain("USAGE");
			expect(outputText).toContain("COMMANDS");
			expect(outputText).toContain("mock");
			expect(outputText).toContain("Mock command description");
		});

		test("translates USAGE and COMMANDS headers with translator", () => {
			const config: CliConfig = {
				bin: "test-cli",
				version: "1.0.0",
				commands: new Map([
					["mock", MockCommand as unknown as CommandCtor],
					["default", DefaultCommand as unknown as CommandCtor],
				]),
			};

			const translator = (text: string, key: string) => {
				const translations: Record<string, string> = {
					"cli.usage": "用法",
					"cli.commands": "命令",
				};
				return translations[key] || text;
			};

			renderRootHelp(config, translator);

			const outputText = output.join("");
			expect(outputText).toContain("用法");
			expect(outputText).toContain("命令");
			expect(outputText).not.toContain("USAGE");
			expect(outputText).not.toContain("COMMANDS");
		});

		test("translates command descriptions with translator", () => {
			const config: CliConfig = {
				bin: "test-cli",
				version: "1.0.0",
				commands: new Map([
					["mock", MockCommand as unknown as CommandCtor],
					["default", DefaultCommand as unknown as CommandCtor],
				]),
			};

			const translator = (text: string, key: string) => {
				const translations: Record<string, string> = {
					"cli.usage": "用法",
					"cli.commands": "命令",
					"commands.mock.description": "模拟命令描述",
					"commands.default.description": "默认命令",
				};
				return translations[key] || text;
			};

			renderRootHelp(config, translator);

			const outputText = output.join("");
			expect(outputText).toContain("模拟命令描述");
			expect(outputText).not.toContain("Mock command description");
		});
	});

	describe("renderCommandHelp", () => {
		test("renders without translator (backward compatibility)", () => {
			renderCommandHelp("test-cli", "mock", MockCommand as unknown as CommandCtor);

			const outputText = output.join("");
			expect(outputText).toContain("Mock command description");
			expect(outputText).toContain("USAGE");
			expect(outputText).toContain("ARGUMENTS");
			expect(outputText).toContain("FLAGS");
			expect(outputText).toContain("EXAMPLES");
			expect(outputText).toContain("Model to use");
			expect(outputText).toContain("Input file path");
		});

		test("translates command description with translator", () => {
			const translator = (text: string, key: string) => {
				const translations: Record<string, string> = {
					"commands.mock.description": "模拟命令描述",
				};
				return translations[key] || text;
			};

			renderCommandHelp("test-cli", "mock", MockCommand as unknown as CommandCtor, translator);

			const outputText = output.join("");
			expect(outputText).toContain("模拟命令描述");
			expect(outputText).not.toContain("Mock command description");
		});

		test("translates USAGE, ARGUMENTS, FLAGS, EXAMPLES headers", () => {
			const translator = (text: string, key: string) => {
				const translations: Record<string, string> = {
					"cli.usage": "用法",
					"cli.arguments": "参数",
					"cli.flags": "选项",
					"cli.examples": "示例",
				};
				return translations[key] || text;
			};

			renderCommandHelp("test-cli", "mock", MockCommand as unknown as CommandCtor, translator);

			const outputText = output.join("");
			expect(outputText).toContain("用法");
			expect(outputText).toContain("参数");
			expect(outputText).toContain("选项");
			expect(outputText).toContain("示例");
			expect(outputText).not.toContain("USAGE");
			expect(outputText).not.toContain("ARGUMENTS");
			expect(outputText).not.toContain("FLAGS");
			expect(outputText).not.toContain("EXAMPLES");
		});

		test("translates flag descriptions with translator", () => {
			const translator = (text: string, key: string) => {
				const translations: Record<string, string> = {
					"flags.model.description": "使用的模型",
					"flags.verbose.description": "启用详细输出",
				};
				return translations[key] || text;
			};

			renderCommandHelp("test-cli", "mock", MockCommand as unknown as CommandCtor, translator);

			const outputText = output.join("");
			expect(outputText).toContain("使用的模型");
			expect(outputText).toContain("启用详细输出");
			expect(outputText).not.toContain("Model to use");
			expect(outputText).not.toContain("Enable verbose output");
		});

		test("translates argument descriptions with translator", () => {
			const translator = (text: string, key: string) => {
				const translations: Record<string, string> = {
					"args.file.description": "输入文件路径",
				};
				return translations[key] || text;
			};

			renderCommandHelp("test-cli", "mock", MockCommand as unknown as CommandCtor, translator);

			const outputText = output.join("");
			expect(outputText).toContain("输入文件路径");
			expect(outputText).not.toContain("Input file path");
		});

		test("falls back to original text when translation not found", () => {
			const translator = (_text: string, key: string) => {
				// Return the key itself to simulate missing translation
				return key;
			};

			renderCommandHelp("test-cli", "mock", MockCommand as unknown as CommandCtor, translator);

			const outputText = output.join("");
			// Should show original text when translator returns key
			expect(outputText).toContain("Mock command description");
			expect(outputText).toContain("Model to use");
		});
	});

	describe("Translator function behavior", () => {
		test("translator receives correct text and key", () => {
			const config: CliConfig = {
				bin: "test-cli",
				version: "1.0.0",
				commands: new Map([["mock", MockCommand as unknown as CommandCtor]]),
			};

			const receivedCalls: Array<{ text: string; key: string }> = [];
			const translator = (text: string, key: string) => {
				receivedCalls.push({ text, key });
				return text;
			};

			renderRootHelp(config, translator);

			// Should have called translator for USAGE and COMMANDS
			expect(receivedCalls.some(call => call.text === "USAGE" && call.key === "cli.usage")).toBe(true);
			expect(receivedCalls.some(call => call.text === "COMMANDS" && call.key === "cli.commands")).toBe(true);
		});

		test("translator can modify text based on context", () => {
			const config: CliConfig = {
				bin: "test-cli",
				version: "1.0.0",
				commands: new Map([["mock", MockCommand as unknown as CommandCtor]]),
			};

			const translator = (text: string, key: string) => {
				if (key === "cli.usage") return "[USAGE]";
				if (key === "cli.commands") return "[COMMANDS]";
				return text;
			};

			renderRootHelp(config, translator);

			const outputText = output.join("");
			expect(outputText).toContain("[USAGE]");
			expect(outputText).toContain("[COMMANDS]");
		});
	});
});
