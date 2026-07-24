#!/usr/bin/env bun
/**
 * 批量翻译设置文件 - 使用翻译映射表完成大部分翻译
 * 剩余未翻译的由子代理处理
 */

import * as fs from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";

const LAN_DIR = path.join(homedir(), ".omp", "lang");

// 翻译映射表
const MAP: Record<string, string> = {
	// Tab 名称
	Appearance: "外观",
	Model: "模型",
	Interaction: "交互",
	Context: "上下文",
	Memory: "记忆",
	Files: "文件",
	Shell: "Shell",
	Tools: "工具",
	Tasks: "任务",
	Providers: "提供商",

	// 分组名
	Theme: "主题",
	"Status Line": "状态栏",
	Display: "显示",
	Images: "图片",
	Thinking: "思考",
	Sampling: "采样",
	Prompt: "提示词",
	"Retry & Fallback": "重试与回退",
	Network: "网络",
	Generating: "生成",
	Agent: "代理",
	Input: "输入",
	Approvals: "审批",
	Notifications: "通知",
	Voice: "语音",
	Collab: "协作",
	General: "通用",
	Git: "Git",
	"Magic Keywords": "魔法关键词",
	"Launch & Update": "启动与更新",
	"Power (macOS)": "电源 (macOS)",
	Proxy: "代理",
	Compaction: "压缩",
	"Rules (TTSR)": "规则 (TTSR)",
	Experimental: "实验性",
	LSP: "LSP",
	Editing: "编辑",
	Reading: "读取",
	"Read Summaries": "读取摘要",
	Session: "会话",
	Subagents: "子代理",
	Toolbox: "工具箱",
	Manual: "手动",
	Sandbox: "沙箱",
	Attribution: "归属",
	Permissions: "权限",
	Browsing: "浏览",
	Media: "媒体",
	Caching: "缓存",
	"Error Handling": "错误处理",
	Advanced: "高级",
	Output: "输出",
	"Auto-Update": "自动更新",
	Defaults: "默认值",
	Fallbacks: "回退",
	Rules: "规则",
	Watchdog: "看门狗",
	Security: "安全",
	Developer: "开发者",
	Debug: "调试",
	State: "状态",
	Selection: "选择",
	Inline: "内联",
	Shortcuts: "快捷键",
	"API Keys": "API 密钥",
	Provider: "提供商",
	Authentication: "认证",
	Visibility: "可见性",
	Cost: "费用",
	History: "历史",
	Browser: "浏览器",
	Preview: "预览",
	Search: "搜索",
	"Editing Tools": "编辑工具",
	"File System": "文件系统",
	Terminal: "终端",
	Background: "后台",
	Batch: "批量",
	Templates: "模板",
	Format: "格式",
	Formatting: "格式化",
	Persistence: "持久化",
	Stats: "统计",
	Dashboard: "仪表盘",
	Sync: "同步",
	Behavior: "行为",
	Environment: "环境",
	Variables: "变量",
	Logging: "日志",
	Timeouts: "超时",
	Limits: "限制",
	Encoding: "编码",
	Charset: "字符集",
	Patterns: "模式",
	Excludes: "排除",
	Filters: "过滤器",
	Sorting: "排序",
	Pagination: "分页",
	Markdown: "Markdown",
	"Code Blocks": "代码块",
	"Line Numbers": "行号",
	Syntax: "语法",
	Highlighting: "高亮",
	Colors: "颜色",
	Contrast: "对比度",
	Font: "字体",
	Scale: "缩放",
	Layout: "布局",
	Spacing: "间距",
	Scrollback: "回滚",
	Performance: "性能",
	"Memory Usage": "内存使用",
	"Background Tasks": "后台任务",
	"Auto-Save": "自动保存",
	Backup: "备份",
	Restore: "恢复",
	"Session Restore": "会话恢复",
	Startup: "启动",
	Shutdown: "关闭",
	Cleanup: "清理",
	Optimization: "优化",
	Preloading: "预加载",
	Warmup: "预热",
	Modes: "模式",
	Profiles: "配置文件",
	Custom: "自定义",
	Default: "默认",
	System: "系统",
	Local: "本地",
	Remote: "远程",
	Server: "服务器",
	Client: "客户端",
	Host: "主机",
	Port: "端口",
	URL: "URL",
	Path: "路径",
	Timeout: "超时",
	Retries: "重试次数",
	Delay: "延迟",
	Interval: "间隔",
	Frequency: "频率",
	Threshold: "阈值",
	Maximum: "最大",
	Minimum: "最小",
	Size: "大小",
	Width: "宽度",
	Height: "高度",
	Depth: "深度",
};

function translate(text: string): string {
	// 精确匹配
	if (MAP[text]) return MAP[text];

	// 常见后缀模式
	if (text.startsWith("Show ")) return `显示${translate(text.slice(5))}`;
	if (text.startsWith("Hide ")) return `隐藏${translate(text.slice(5))}`;
	if (text.startsWith("Enable ")) return `启用${translate(text.slice(7))}`;
	if (text.startsWith("Disable ")) return `禁用${translate(text.slice(8))}`;
	if (text.startsWith("Use ")) return `使用${translate(text.slice(4))}`;
	if (text.startsWith("Set ")) return `设置${translate(text.slice(4))}`;
	if (text.startsWith("Allow ")) return `允许${translate(text.slice(6))}`;
	if (text.startsWith("Block ")) return `阻止${translate(text.slice(6))}`;
	if (text.startsWith("Auto ")) return `自动${translate(text.slice(5))}`;
	if (text.startsWith("Manual ")) return `手动${translate(text.slice(7))}`;

	// 未匹配则返回空字符串，标记需要手动翻译
	return "";
}

// 主流程
const settingsFiles = fs.readdirSync(LAN_DIR).filter(f => f.startsWith("zh-settings-") && f.endsWith(".json"));

let totalTranslated = 0;
let totalRemaining = 0;
const remainingByFile: Record<string, string[]> = {};

for (const zhFile of settingsFiles) {
	const enFile = zhFile.replace("zh-", "en-");
	const zhPath = path.join(LAN_DIR, zhFile);
	const enPath = path.join(LAN_DIR, enFile);

	if (!fs.existsSync(enPath)) continue;

	const zhData = JSON.parse(fs.readFileSync(zhPath, "utf-8")) as Record<string, string>;
	const enData = JSON.parse(fs.readFileSync(enPath, "utf-8")) as Record<string, string>;

	const remaining: string[] = [];

	for (const [key, zhValue] of Object.entries(zhData)) {
		if (zhValue !== "" && !zhValue.startsWith("（见")) continue;

		const enValue = enData[key];
		if (!enValue) continue;

		const translated = translate(enValue);
		if (translated) {
			zhData[key] = translated;
			totalTranslated++;
		} else {
			remaining.push(`${key}|${enValue}`);
			totalRemaining++;
		}
	}

	// 始终写回，即使没有新翻译（确保一致性）
	fs.writeFileSync(zhPath, `${JSON.stringify(zhData, null, 2)}\n`);

	if (remaining.length > 0) {
		remainingByFile[zhFile] = remaining;
	}
}

// 输出结果
console.log(`翻译完成: ${totalTranslated} 条`);
console.log(`剩余未翻译: ${totalRemaining} 条\n`);

for (const [file, items] of Object.entries(remainingByFile)) {
	console.log(`\n=== ${file} (${items.length} 条剩余) ===`);
	for (const item of items.slice(0, 5)) {
		const [key, enValue] = item.split("|");
		console.log(`  ${key}: ${enValue}`);
	}
	if (items.length > 5) console.log(`  ... 还有 ${items.length - 5} 条`);
}

// 生成剩余翻译的 JSON 文件供子代理使用
const remainingPath = path.join(LAN_DIR, "_remaining_translations.json");
const remainingData: Record<string, Record<string, string>> = {};
for (const [file, items] of Object.entries(remainingByFile)) {
	const fileMap: Record<string, string> = {};
	for (const item of items) {
		const [key, enValue] = item.split("|");
		fileMap[key] = enValue;
	}
	remainingData[file] = fileMap;
}
fs.writeFileSync(remainingPath, `${JSON.stringify(remainingData, null, 2)}\n`);
console.log(`\n剩余翻译已保存到: ${remainingPath}`);
