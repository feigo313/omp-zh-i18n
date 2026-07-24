import { useCallback, useSyncExternalStore } from "react";

export type Locale = "en" | "zh";

type TranslationParams = Record<string, string | number>;

export type TranslationFn = (key: string, params?: TranslationParams) => string;

const STORAGE_KEY = "omp-stats-locale";

const translations: Record<Locale, Record<string, string>> = {
	en: {
		// Navigation
		"nav.title": "OH MY PI",
		"nav.subtitle": "Observability",
		"nav.version": "OMP Stats v{version}",
		"nav.section.overview": "Overview",
		"nav.section.requests": "Requests",
		"nav.section.errors": "Errors",
		"nav.section.models": "Models",
		"nav.section.tools": "Tools",
		"nav.section.costs": "Costs",
		"nav.section.behavior": "Behavior",
		"nav.section.projects": "Projects",
		"nav.section.gain": "Gain",
		"nav.menu": "Navigation menu",
		"nav.closeMenu": "Close navigation menu",
		"nav.observability": "Observability",
		"nav.menu.open": "Open navigation menu",
		"nav.menu.close": "Close navigation menu",
		"nav.menu.title": "Navigation menu",
		"nav.collapseMenu": "Collapse menu",
		"nav.expandMenu": "Expand menu",

		// Top bar
		"topBar.observability": "Observability",
		"topBar.languageToggle": "Switch language",
		"topBar.openMenu": "Open menu",
		"topBar.notUpdated": "Not updated",
		"topBar.updated": "Updated {time}",

		// Time ranges
		"range.all": "All",
		"range.allTime": "all time",
		"range.lastHour": "the last hour",
		"range.last24h": "the last 24 hours",
		"range.last7d": "the last 7 days",
		"range.last30d": "the last 30 days",
		"range.last90d": "the last 90 days",

		// Trend labels (for table columns)
		"trend.1h": "1h Trend",
		"trend.24h": "24h Trend",
		"trend.7d": "7d Trend",
		"trend.30d": "30d Trend",
		"trend.90d": "90d Trend",
		"trend.all": "Trend",

		// Range control
		"rangeControl.all": "All",
		"rangeControl.selectRange": "Select time range",
		"rangeControl.label": "Select time range",

		// Sync button
		"sync.syncing": "Syncing...",
		"sync.syncDb": "Sync DB",
		"sync.synced": "Synced {count} requests",
		"sync.success": "Synced: {count} new request{plural} found.",
		"sync.failed": "Sync failed: {error}",

		// Theme toggle
		"theme.system": "System theme",
		"theme.light": "Light theme",
		"theme.dark": "Dark theme",
		"theme.switchHint": "Switch to {theme}",

		// Metrics
		"metric.totalCost": "Total Cost",
		"metric.requests": "Requests",
		"metric.cacheRate": "Cache Rate",
		"metric.errorRate": "Error Rate",
		"metric.inputTokens": "Input Tokens",
		"metric.outputTokens": "Output Tokens",
		"metric.premiumRequests": "Premium Requests",
		"metric.tokensPerSec": "Tokens/s",
		"metric.avgLatency": "Avg Latency",
		"metric.avgTTFT": "Avg TTFT",

		// Common labels
		"common.model": "Model",
		"common.provider": "Provider",
		"common.time": "Time",
		"common.tokens": "Tokens",
		"common.cost": "Cost",
		"common.duration": "Duration",
		"common.status": "Status",
		"common.input": "Input",
		"common.output": "Output",
		"common.cacheRead": "Cache Read",
		"common.cacheWrite": "Cache Write",
		"common.reasoning": "Reasoning",
		"common.tps": "TPS",
		"common.success": "Success",
		"common.failed": "Failed",
		"common.error": "Error",
		"common.premium": "Premium",
		"common.loading": "Loading...",
		"common.noData": "No data available",
		"common.retry": "Retry",
		"common.failedToLoad": "Failed to load data",

		// Overview route
		"overview.throughput": "System Throughput",
		"overview.throughput.title": "System Throughput",
		"overview.throughput.subtitle": "Request volume and errors over time",
		"overview.feed.title": "Operational Feed",
		"overview.feed.subtitle": "Real-time request log",
		"overview.preview.title": "Recent Requests Preview",
		"overview.preview.subtitle": "Latest transactions processed by the proxy",
		"overview.viewAll": "View All Requests",
		"overview.noRecentRequests": "No recent requests found",
		"overview.noTimeSeries": "No time-series data available",
		"overview.chart.requests": "Requests",
		"overview.chart.errors": "Errors",
		"overview.agentToken.title": "Token Usage by Agent",
		"overview.agentToken.subtitle": "Share of tokens across the main agent, task subagents, and the advisor",
		"agent.main": "Main agent",
		"agent.subagent": "Subagents",
		"agent.advisor": "Advisor",
		"agent.noTokenUsage": "No token usage in this range",

		// Exchange rate
		"exchangeRate.label": "USD Rate",
		"exchangeRate.refresh": "Refresh",
		"exchangeRate.updated": "Updated {time}",

		// Requests route
		"requests.title": "All Recent Requests",
		"requests.subtitle": "Up to 50 most recent requests processed by OMP",
		"requests.noRequests": "No recent requests found",
		"requests.status.failed": "Failed",
		"requests.status.success": "Success",
		"requests.column.time": "Time",
		"requests.column.model": "Model",
		"requests.column.status": "Status",
		"requests.column.tokens": "Tokens",
		"requests.column.inputOutput": "Input/Output",
		"requests.column.cache": "Cache R/W",
		"requests.column.tokensPerSec": "Tokens/s",
		"requests.column.duration": "Duration",
		"requests.column.cost": "Cost",
		"requests.filterAllModels": "All models",

		// Errors route
		"errors.title": "Recent Errors",
		"errors.subtitle": "Up to 50 most recent failed requests in the stats database",
		"errors.noErrors": "No recent failures in the local stats database",
		"errors.noFailures": "No recent failures",
		"errors.status.failed": "Failed",
		"errors.unknownError": "Unknown error",
		"errors.column.time": "Time",
		"errors.column.model": "Model",
		"errors.column.tokens": "Tokens",
		"errors.column.cost": "Cost",
		"errors.column.errorMessage": "Error Message",

		// Models route
		"models.preference": "Model Preference",
		"models.noData": "No data available",
		"models.statistics": "Model Statistics",
		"models.requests": "Requests",
		"models.cost": "Cost",
		"models.tokens": "Tokens",
		"models.tokensPerSec": "Tokens/s",
		"models.ttft": "TTFT",
		"models.trend": "Trend",
		"models.quality": "Quality",
		"models.errorRate": "Error rate",
		"models.cacheRate": "Cache rate",
		"models.latency": "Latency",
		"models.avgDuration": "Avg duration",
		"models.avgTTFT": "Avg TTFT",
		"models.table.title": "Model Statistics",
		"models.table.columns.model": "Model",
		"models.table.columns.requests": "Requests",
		"models.table.columns.tokens": "Tokens",
		"models.table.columns.cost": "Cost",
		"models.table.columns.tokensPerSec": "Tokens/s",
		"models.table.columns.ttft": "TTFT",
		"models.expanded-quality": "Quality",
		"models.expanded-errorRate": "Error rate",
		"models.expanded-cacheRate": "Cache rate",
		"models.expanded-latency": "Latency",
		"models.expanded-avgDuration": "Avg duration",
		"models.expanded-avgTTFT": "Avg TTFT",
		"models.shareChart-title": "Model Preference",
		"models.shareChart-subtitle": "Share of requests over {window}",
		"models.shareChart-noData": "No data available",

		// Costs route
		"costs.total": "Total",
		"costs.totalCost": "Total Cost",
		"costs.avgPerDay": "Average / Day",
		"costs.avgDailyCost": "Average / Day",
		"costs.topModel": "Top Model",
		"costs.totalSpent": "Total spent: {amount}",
		"costs.dailyCost": "Daily Cost",
		"costs.dailyCostSub": "API spending over time",
		"costs.label": "Cost",
		"costs.apiSpending": "API spending over time",
		"costs.noData": "No cost data available",
		"costs.allModels": "All Models",
		"costs.byModel": "By Model",

		// Behavior route
		"behavior.messages": "User Messages",
		"behavior.userMessages": "User Messages",
		"behavior.inRange": "in range",
		"behavior.asPercentOfMessages": "as % of messages",
		"behavior.yellingCaps": "Yelling (CAPS)",
		"behavior.profanityHits": "Profanity Hits",
		"behavior.anguishSignals": "Anguish Signals",
		"behavior.frictionSignals": "Friction Signals",
		"behavior.highestFrictionModel": "Highest Friction model",
		"behavior.hits": "hits",
		"behavior.title": "User Friction Signals",
		"behavior.subtitle": "{metric} as % of user messages per day",
		"behavior.noData": "No friction signal data available",
		"behavior.noBehaviorData": "No user behavior recorded for this range yet.",
		"behavior.allModels": "All Models",
		"behavior.byModel": "By Model",
		"behavior.byModelTitle": "Behavior Signals by Model",
		"behavior.byModelSub": "Rates are per user message",
		"behavior.byModelSubtitle": "Behavior signals breakdown by model",
		"behavior.caps": "CAPS",
		"behavior.profanity": "Profanity",
		"behavior.anguish": "Anguish",
		"behavior.negation": "Negation",
		"behavior.repetition": "Repetition",
		"behavior.blame": "Blame",
		"behavior.frustration": "Frustration",
		"behavior.all": "All",
		"behavior.anguishFull": "Anguish (!!!, nooo, dude, ..)",
		"behavior.negationFull": "Negation (no/nope/wrong)",
		"behavior.repetitionFull": "Repetition (i meant, still doesnt)",
		"behavior.blameFull": "Blame (you didnt, stop X-ing)",
		"behavior.frustrationFull": "Frustration (neg + rep + blame)",
		"behavior.allCombined": "All signals combined",
		"behavior.model": "Model",
		"behavior.messagesCol": "Messages",
		"behavior.percentOfMsgs": "% of msgs",
		"behavior.perMsg": "Per msg",
		"behavior.perMsgSuffix": "/ msg",
		"behavior.anguishPercent": "Anguish %",
		"behavior.frustrationPercent": "Frustration %",
		"behavior.hitsPercent": "Hits %",
		"behavior.trend": "Trend",
		"behavior.avgCharsPerMsg": "Avg chars / msg",
		"behavior.total": "Total",
		"behavior.detailTotal": "Total",
		"behavior.detailPerMsg": "Per msg",
		"behavior.detailRate": "Rate",
		"behavior.metric-caps": "CAPS",
		"behavior.metric-profanity": "Profanity",
		"behavior.metric-anguish": "Anguish",
		"behavior.metric-negation": "Negation",
		"behavior.metric-repetition": "Repetition",
		"behavior.metric-blame": "Blame",
		"behavior.metric-frustration": "Frustration",
		"behavior.metric-all": "All",
		"behavior.metricTitle-caps": "Yelling (CAPS)",
		"behavior.metricTitle-profanity": "Profanity",
		"behavior.metricTitle-anguish": "Anguish (!!!, nooo, dude, ..)",
		"behavior.metricTitle-negation": "Negation (no/nope/wrong)",
		"behavior.metricTitle-repetition": "Repetition (i meant, still doesnt)",
		"behavior.metricTitle-blame": "Blame (you didnt, stop X-ing)",
		"behavior.metricTitle-frustration": "Frustration (neg + rep + blame)",
		"behavior.metricTitle-all": "All signals combined",
		"behavior.chart-yelling": "CAPS",
		"behavior.chart-profanity": "Profanity",
		"behavior.chart-anguish": "Anguish",
		"behavior.chart-frustration": "Frustration",
		"behavior.detail-yelling": "Yelling (CAPS)",
		"behavior.detail-profanity": "Profanity",
		"behavior.detail-anguish": "Anguish (!!!, nooo, dude, ..)",
		"behavior.detail-negation": "Negation (no/nope/wrong)",
		"behavior.detail-repetition": "Repetition (i meant, still doesnt)",
		"behavior.detail-blame": "Blame (you didnt, stop X-ing)",
		"behavior.detail-avgChars": "Avg chars / msg",
		"behavior.errSuffix": "Err",
		"behavior.columns.model": "Model",
		"behavior.columns.messages": "Messages",
		"behavior.columns.caps": "CAPS",
		"behavior.columns.profanity": "Profanity",
		"behavior.columns.anguish": "Anguish",
		"behavior.columns.frustration": "Frustration",
		"behavior.columns.hits": "Hits",
		"behavior.columns.trend": "Trend",

		// Projects route
		"projects.title": "Projects & Folders",
		"projects.subtitle": "Aggregate proxy metrics grouped by folder path",
		"projects.noData": "No project folders recorded for this range.",
		"projects.noFolders": "No folders found",
		"projects.folder": "Project/Folder",
		"projects.root": "(root)",
		"projects.errSuffix": "Err",
		"projects.requests": "Requests",
		"projects.cost": "Cost",
		"projects.tokens": "Tokens",
		"projects.cacheRate": "Cache Rate",
		"projects.errorRate": "Error Rate",
		"projects.avgDuration": "Avg Duration",
		"projects.column.folder": "Project/Folder",
		"projects.column.requests": "Requests",
		"projects.column.tokens": "Tokens",
		"projects.column.cost": "Cost",
		"projects.column.avgDuration": "Avg Duration",
		"projects.column.errorRate": "Error Rate",
		"projects.column.cacheRate": "Cache Rate",

		// Request drawer
		"detail.title": "Request Details",
		"detail.id": "ID",
		"detail.cost": "Cost",
		"detail.premium": "Premium",
		"detail.totalTokens": "Total Tokens",
		"detail.duration": "Duration",
		"detail.ttft": "TTFT",
		"detail.throughput": "Throughput",
		"detail.tokensPerSecond": "tokens/second",
		"detail.outputPayload": "Output Payload",
		"detail.rawMetadata": "Raw Request Metadata",
		"detail.errorMessage": "Error Message",
		"detail.failedToLoad": "Failed to load request details",
		"detail.inOut": "{input} in · {output} out",
		"detail.close": "Close request details",

		// JSON block
		"json.title": "JSON",
		"json.copy": "Copy",
		"json.copied": "Copied",
		"json.copyToClipboard": "Copy JSON to clipboard",
		"json.copiedToClipboard": "Copied to clipboard",
		"json.show": "Show",
		"json.hide": "Hide",

		// Pagination
		"pagination.navigation": "Pagination",
		"pagination.previous": "Previous page",
		"pagination.next": "Next page",
		"pagination.goToPage": "Go to page {page}",
		"pagination.pageInfo": "Page {current} of {total}",

		// Gain route
		"gain.project": "Project",
		"gain.allProjects": "All projects",
		"gain.overall.title": "Overall Gain",
		"gain.overall.subtitle": "Aggregate snapcompact savings",
		"gain.savedTokens": "Saved Tokens",
		"gain.savedBytes": "Saved Bytes",
		"gain.reduction": "Reduction",
		"gain.totalHits": "Total Hits",
		"gain.hits": "Hits",
		"gain.bySource.title": "By Source",
		"gain.bySource.subtitle": "Savings breakdown per subsystem",
		"gain.source.snapcompact": "Snapcompact",
		"gain.tokensSaved": "Tokens Saved",
		"gain.timeSeries.title": "Savings Over Time",
		"gain.timeSeries.subtitle": "Daily token savings",
		"gain.noTimeSeries": "No time series data yet",

		// Tools route
		"tools.title": "Tool Usage",
		"tools.subtitle": "Tokens/cost are the invoking turns' real provider usage, split across each turn's tool calls",
		"tools.emptyText": "No tool calls recorded for this range.",
		"tools.metric.toolCalls": "Tool Calls",
		"tools.metric.toolsUsed": "Tools Used",
		"tools.metric.errorRate": "Error Rate",
		"tools.metric.attributedCost": "Attributed Cost",
		"tools.metric.attributedTokens": "Attributed Tokens",
		"tools.metric.attributedOutput": "Attributed Output",
		"tools.metric.resultText": "Result Text",
		"tools.metric.callArguments": "Call Arguments",
		"tools.metric.charsSuffix": "chars",
		"tools.chart.title": "Calls Over Time",
		"tools.chart.subtitle": "Tool calls over {window}, stacked by tool",
		"tools.chart.noData": "No data available",
		"tools.chart.tooltipCallsSuffix": "calls",
		"tools.chart.other": "Other",
		"tools.table.byToolTitle": "By Tool",
		"tools.table.byToolSubtitle": "Usage per tool, most called first",
		"tools.table.column.tool": "Tool",
		"tools.table.column.calls": "Calls",
		"tools.table.column.errorRate": "Error Rate",
		"tools.table.column.attrTokens": "Attr. Tokens",
		"tools.table.column.attrCost": "Attr. Cost",
		"tools.table.column.resultText": "Result Text",
		"tools.table.column.lastUsed": "Last Used",
		"tools.table.tooltip.attrTokens": "Invoking turns' total tokens, split across each turn's calls",
		"tools.table.tooltip.resultText": "Characters of tool-result text fed back into context",
		"tools.mobile.errSuffix": "Err",
		"tools.model.title": "By Model",
		"tools.model.subtitle": "Which models call which tools",
		"tools.model.filterLabel": "Tool",
		"tools.model.filterAll": "All tools",
		"tools.model.unknown": "(unknown)",
	},

	zh: {
		// Navigation
		"nav.title": "OH MY PI",
		"nav.subtitle": "可观测性",
		"nav.version": "OMP Stats v{version}",
		"nav.section.overview": "概览",
		"nav.section.requests": "请求",
		"nav.section.errors": "错误",
		"nav.section.models": "模型",
		"nav.section.tools": "工具",
		"nav.section.costs": "成本",
		"nav.section.behavior": "行为",
		"nav.section.projects": "项目",
		"nav.section.gain": "收益",
		"nav.menu.open": "打开导航菜单",
		"nav.menu.close": "关闭导航菜单",
		"nav.menu.title": "导航菜单",
		"nav.observability": "可观测性",
		"nav.menu": "导航菜单",
		"nav.closeMenu": "关闭导航菜单",
		"nav.collapseMenu": "收起菜单",
		"nav.expandMenu": "展开菜单",

		// Time ranges
		"range.all": "全部",
		"range.allTime": "全部时间",
		"range.lastHour": "过去一小时",
		"range.last24h": "过去24小时",
		"range.last7d": "过去7天",
		"range.last30d": "过去30天",
		"range.last90d": "过去90天",

		// Trend labels (for table columns)
		"trend.1h": "1小时趋势",
		"trend.24h": "24小时趋势",
		"trend.7d": "7天趋势",
		"trend.30d": "30天趋势",
		"trend.90d": "90天趋势",
		"trend.all": "趋势",

		// Range control
		"rangeControl.label": "选择时间范围",
		"rangeControl.all": "全部",
		"rangeControl.selectRange": "选择时间范围",

		// Sync button
		"sync.syncing": "同步中...",
		"sync.syncDb": "同步数据库",
		"sync.success": "同步完成: 发现 {count} 个新请求。",
		"sync.failed": "同步失败: {error}",

		// Theme toggle
		"theme.system": "系统主题",
		"theme.light": "浅色主题",
		"theme.dark": "深色主题",
		"theme.switchHint": "切换到{theme}",

		// Metrics
		"metric.totalCost": "总成本",
		"metric.requests": "请求数",
		"metric.cacheRate": "缓存命中率",
		"metric.errorRate": "错误率",
		"metric.inputTokens": "输入 Tokens",
		"metric.outputTokens": "输出 Tokens",
		"metric.premiumRequests": "高级请求",
		"metric.tokensPerSec": "Tokens/秒",
		"metric.avgLatency": "平均延迟",
		"metric.avgTTFT": "平均 TTFT",

		// Common labels
		"common.model": "模型",
		"common.provider": "提供商",
		"common.duration": "耗时",
		"common.status": "状态",
		"common.input": "输入",
		"common.output": "输出",
		"common.cacheRead": "缓存读取",
		"common.cacheWrite": "缓存写入",
		"common.reasoning": "推理",
		"common.tps": "TPS",
		"common.success": "成功",
		"common.failed": "失败",
		"common.error": "错误",
		"common.premium": "高级",
		"common.loading": "加载中...",
		"common.noData": "暂无数据",
		"common.retry": "重试",
		"common.failedToLoad": "加载数据失败",

		// Overview route
		"overview.throughput": "系统吞吐量",
		"overview.throughput.title": "系统吞吐量",
		"overview.throughput.subtitle": "请求量和错误随时间变化",
		"overview.feed.title": "实时动态",
		"overview.feed.subtitle": "实时请求日志",
		"overview.preview.title": "最近请求预览",
		"overview.preview.subtitle": "代理处理的最新事务",
		"overview.viewAll": "查看所有请求",
		"overview.noRecentRequests": "未找到最近请求",
		"overview.noTimeSeries": "无时序数据",
		"overview.chart.requests": "请求",
		"overview.chart.errors": "错误",
		"overview.agentToken.title": "Agent Token 用量",
		"overview.agentToken.subtitle": "主 agent、任务子 agent 和 advisor 的 token 占比",
		"agent.main": "主 Agent",
		"agent.subagent": "子 Agent",
		"agent.advisor": "Advisor",
		"agent.noTokenUsage": "此时间范围内无 token 使用",

		// Exchange rate
		"exchangeRate.label": "美元汇率",
		"exchangeRate.refresh": "刷新",
		"exchangeRate.updated": "{time} 更新",

		// Requests route
		"requests.title": "所有最近请求",
		"requests.subtitle": "OMP 处理的最多50个最近请求",
		"requests.noRequests": "未找到最近请求",
		"requests.status.failed": "失败",
		"requests.status.success": "成功",
		"requests.column.time": "时间",
		"requests.column.model": "模型",
		"requests.column.status": "状态",
		"requests.column.tokens": "Tokens",
		"requests.column.inputOutput": "输入/输出",
		"requests.column.cache": "缓存读/写",
		"requests.column.tokensPerSec": "Tokens/秒",
		"requests.column.cost": "成本",
		"requests.column.duration": "耗时",
		"requests.filterAllModels": "所有模型",

		// Errors route
		"errors.title": "最近错误",
		"errors.subtitle": "统计数据库中最多50个最近失败请求",
		"errors.noErrors": "本地统计数据库中无最近失败",
		"errors.column.time": "时间",
		"errors.column.model": "模型",
		"errors.column.tokens": "Tokens",
		"errors.column.cost": "成本",
		"errors.column.errorMessage": "错误信息",
		"errors.status.failed": "失败",
		"errors.unknownError": "未知错误",
		"errors.noFailures": "无最近失败",

		// Models route
		"models.preference": "模型偏好",
		"models.noData": "暂无数据",
		"models.statistics": "模型统计",
		"models.requests": "请求数",
		"models.cost": "成本",
		"models.tokens": "Tokens",
		"models.tokensPerSec": "Tokens/秒",
		"models.ttft": "TTFT",
		"models.trend": "趋势",
		"models.quality": "质量",
		"models.errorRate": "错误率",
		"models.cacheRate": "缓存命中率",
		"models.latency": "延迟",
		"models.avgDuration": "平均耗时",
		"models.avgTTFT": "平均 TTFT",
		"models.table.title": "模型统计",
		"models.table.columns.model": "模型",
		"models.table.columns.requests": "请求数",
		"models.table.columns.cost": "成本",
		"models.table.columns.tokens": "Tokens",
		"models.table.columns.tokensPerSec": "Tokens/秒",
		"models.table.columns.ttft": "TTFT",
		"models.expanded-quality": "质量",
		"models.expanded-errorRate": "错误率",
		"models.expanded-cacheRate": "缓存命中率",
		"models.expanded-latency": "延迟",
		"models.expanded-avgDuration": "平均耗时",
		"models.expanded-avgTTFT": "平均 TTFT",
		"models.shareChart-title": "模型偏好",
		"models.shareChart-subtitle": "{window}内的请求份额",
		"models.shareChart-noData": "暂无数据",

		// Costs route
		"costs.total": "总计",
		"costs.totalCost": "总成本",
		"costs.avgPerDay": "日均成本",
		"costs.avgDailyCost": "日均成本",
		"costs.topModel": "最高成本模型",
		"costs.totalSpent": "总花费: {amount}",
		"costs.dailyCostSub": "API 支出随时间变化",
		"costs.dailyCost": "每日成本",
		"costs.label": "成本",
		"costs.apiSpending": "API 支出随时间变化",
		"costs.noData": "无成本数据",
		"costs.allModels": "所有模型",
		"costs.byModel": "按模型",

		// Behavior route
		"behavior.messages": "用户消息",
		"behavior.inRange": "范围内",
		"behavior.byModelSub": "比率为每条用户消息",
		"behavior.highestFrictionModel": "最高摩擦模型",
		"behavior.userMessages": "用户消息",
		"behavior.yellingCaps": "大写喊叫",
		"behavior.profanityHits": "脏话命中",
		"behavior.anguishSignals": "痛苦信号",
		"behavior.frictionSignals": "摩擦信号",
		"behavior.hits": "次命中",
		"behavior.title": "用户摩擦信号",
		"behavior.subtitle": "{metric} 占每日用户消息的百分比",
		"behavior.asPercentOfMessages": "占消息百分比",
		"behavior.noData": "无摩擦信号数据",
		"behavior.noBehaviorData": "此范围内暂无用户行为记录。",
		"behavior.allModels": "所有模型",
		"behavior.byModel": "按模型",
		"behavior.byModelTitle": "按模型的行为信号",
		"behavior.byModelSubtitle": "按模型的行为信号细分",
		"behavior.columns.model": "模型",
		"behavior.columns.messages": "消息数",
		"behavior.columns.caps": "大写",
		"behavior.columns.profanity": "脏话",
		"behavior.columns.anguish": "痛苦",
		"behavior.columns.frustration": "沮丧",
		"behavior.columns.hits": "命中",
		"behavior.columns.trend": "趋势",
		"behavior.caps": "大写",
		"behavior.profanity": "脏话",
		"behavior.anguish": "痛苦",
		"behavior.negation": "否定",
		"behavior.repetition": "重复",
		"behavior.blame": "责备",
		"behavior.frustration": "沮丧",
		"behavior.all": "全部",
		"behavior.anguishFull": "痛苦 (!!!, nooo, dude, ..)",
		"behavior.negationFull": "否定 (no/nope/wrong)",
		"behavior.repetitionFull": "重复 (i meant, still doesnt)",
		"behavior.blameFull": "责备 (you didnt, stop X-ing)",
		"behavior.frustrationFull": "沮丧 (否定 + 重复 + 责备)",
		"behavior.allCombined": "所有信号合计",
		"behavior.model": "模型",
		"behavior.messagesCol": "消息数",
		"behavior.capsPercent": "大写 %",
		"behavior.profanityPercent": "脏话 %",
		"behavior.anguishPercent": "痛苦 %",
		"behavior.frustrationPercent": "沮丧 %",
		"behavior.hitsPercent": "命中 %",
		"behavior.trend": "趋势",
		"behavior.avgCharsPerMsg": "平均字符/消息",
		"behavior.total": "总计",
		"behavior.percentOfMsgs": "消息占比",
		"behavior.perMsg": "每条消息",
		"behavior.perMsgSuffix": "/ 消息",
		"behavior.detailTotal": "总计",
		"behavior.detailPerMsg": "每条消息",
		"behavior.detailRate": "比率",
		"behavior.metric-caps": "大写",
		"behavior.metric-profanity": "脏话",
		"behavior.metric-anguish": "痛苦",
		"behavior.metric-negation": "否定",
		"behavior.metric-repetition": "重复",
		"behavior.metric-blame": "责备",
		"behavior.metric-frustration": "沮丧",
		"behavior.metric-all": "全部",
		"behavior.metricTitle-caps": "大写喊叫",
		"behavior.metricTitle-profanity": "脏话",
		"behavior.metricTitle-anguish": "痛苦 (!!!, nooo, dude, ..)",
		"behavior.metricTitle-negation": "否定 (no/nope/wrong)",
		"behavior.metricTitle-repetition": "重复 (i meant, still doesnt)",
		"behavior.metricTitle-blame": "责备 (you didnt, stop X-ing)",
		"behavior.metricTitle-frustration": "沮丧 (否定 + 重复 + 责备)",
		"behavior.metricTitle-all": "所有信号合计",
		"behavior.chart-yelling": "大写",
		"behavior.chart-profanity": "脏话",
		"behavior.chart-anguish": "痛苦",
		"behavior.chart-frustration": "沮丧",
		"behavior.detail-yelling": "大写喊叫",
		"behavior.detail-profanity": "脏话",
		"behavior.detail-anguish": "痛苦 (!!!, nooo, dude, ..)",
		"behavior.detail-negation": "否定 (no/nope/wrong)",
		"behavior.detail-repetition": "重复 (i meant, still doesnt)",
		"behavior.detail-blame": "责备 (you didnt, stop X-ing)",
		"behavior.detail-avgChars": "平均字符/消息",
		"behavior.errSuffix": "错误",

		// Projects route
		"projects.title": "项目与文件夹",
		"projects.subtitle": "按文件夹路径分组的聚合代理指标",
		"projects.noData": "此范围内无项目文件夹记录。",
		"projects.folder": "项目/文件夹",
		"projects.root": "(根目录)",
		"projects.errSuffix": "错误",
		"projects.requests": "请求数",
		"projects.cost": "成本",
		"projects.tokens": "Tokens",
		"projects.cacheRate": "缓存命中率",
		"projects.errorRate": "错误率",
		"projects.avgDuration": "平均耗时",
		"projects.column.folder": "项目/文件夹",
		"projects.column.requests": "请求数",
		"projects.column.tokens": "Tokens",
		"projects.column.cost": "成本",
		"projects.column.avgDuration": "平均耗时",
		"projects.column.errorRate": "错误率",
		"projects.column.cacheRate": "缓存命中率",
		"projects.noFolders": "未找到文件夹",

		// Request drawer
		"detail.title": "请求详情",
		"detail.id": "ID",
		"detail.cost": "成本",
		"detail.premium": "高级",
		"detail.totalTokens": "总 Tokens",
		"detail.duration": "耗时",
		"detail.ttft": "TTFT",
		"detail.throughput": "吞吐量",
		"detail.tokensPerSecond": "tokens/秒",
		"detail.outputPayload": "输出负载",
		"detail.rawMetadata": "原始请求元数据",
		"detail.errorMessage": "错误信息",
		"detail.failedToLoad": "加载请求详情失败",
		"detail.inOut": "{input} 入 · {output} 出",
		"detail.close": "关闭请求详情",

		// JSON block
		"json.title": "JSON",
		"json.copy": "复制",
		"json.copied": "已复制",
		"json.copyToClipboard": "复制 JSON 到剪贴板",
		"json.copiedToClipboard": "已复制到剪贴板",
		"json.show": "显示",
		"json.hide": "隐藏",

		// Pagination
		"pagination.navigation": "分页导航",
		"pagination.previous": "上一页",
		"pagination.next": "下一页",
		"pagination.goToPage": "跳转到第 {page} 页",
		"pagination.pageInfo": "第 {current} 页，共 {total} 页",

		// Gain route
		"gain.project": "项目",
		"gain.allProjects": "所有项目",
		"gain.overall.title": "总体收益",
		"gain.overall.subtitle": "Snapcompact 压缩节省汇总",
		"gain.savedTokens": "节省 Tokens",
		"gain.savedBytes": "节省字节",
		"gain.reduction": "压缩率",
		"gain.totalHits": "总命中",
		"gain.hits": "命中",
		"gain.bySource.title": "按来源",
		"gain.bySource.subtitle": "各子系统节省明细",
		"gain.source.snapcompact": "Snapcompact",
		"gain.tokensSaved": "节省 Tokens",
		"gain.timeSeries.title": "节省趋势",
		"gain.timeSeries.subtitle": "每日 Token 节省量",
		"gain.noTimeSeries": "暂无时序数据",

		// Tools route
		"tools.title": "工具使用情况",
		"tools.subtitle": "Token/成本为调用轮次的实际提供商用量，按该轮次的各工具调用分摊",
		"tools.emptyText": "此时间范围内无工具调用记录。",
		"tools.metric.toolCalls": "工具调用",
		"tools.metric.toolsUsed": "使用工具数",
		"tools.metric.errorRate": "错误率",
		"tools.metric.attributedCost": "分摊成本",
		"tools.metric.attributedTokens": "分摊 Tokens",
		"tools.metric.attributedOutput": "分摊输出",
		"tools.metric.resultText": "结果文本",
		"tools.metric.callArguments": "调用参数",
		"tools.metric.charsSuffix": "字符",
		"tools.chart.title": "调用趋势",
		"tools.chart.subtitle": "{window}内的工具调用，按工具堆叠",
		"tools.chart.tooltipCallsSuffix": "次调用",
		"tools.chart.other": "其他",
		"tools.table.byToolTitle": "按工具",
		"tools.table.byToolSubtitle": "各工具使用情况，按调用次数排序",
		"tools.table.column.tool": "工具",
		"tools.table.column.calls": "调用",
		"tools.table.column.errorRate": "错误率",
		"tools.table.column.attrTokens": "分摊 Tokens",
		"tools.table.column.attrCost": "分摊成本",
		"tools.table.column.resultText": "结果文本",
		"tools.table.column.lastUsed": "最近使用",
		"tools.table.tooltip.attrTokens": "调用轮次的总 tokens，按该轮次的各调用分摊",
		"tools.table.tooltip.resultText": "反馈到上下文中的工具结果文本字符数",
		"tools.mobile.errSuffix": "错误",
		"tools.model.title": "按模型",
		"tools.model.subtitle": "各模型调用哪些工具",
		"tools.model.filterLabel": "工具",
		"tools.model.filterAll": "所有工具",
		"tools.model.unknown": "(未知)",
	},
};
let currentLocale: Locale;
const listeners = new Set<() => void>();

function detectInitialLocale(): Locale {
	// Check localStorage first
	if (typeof window !== "undefined") {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored === "en" || stored === "zh") {
				return stored;
			}
		} catch {
			// localStorage unavailable (e.g. SSR or privacy mode)
		}

		// Detect from browser language
		if (typeof navigator !== "undefined" && navigator.language) {
			if (navigator.language.startsWith("zh")) {
				return "zh";
			}
		}
	}
	return "en";
}

currentLocale = detectInitialLocale();
// 初始化时同步 document lang，避免首次加载中文时 <html lang="en"> 未更新
if (typeof document !== "undefined") {
	document.documentElement.lang = currentLocale === "zh" ? "zh-CN" : "en";
}

function notifyListeners() {
	for (const listener of listeners) {
		listener();
	}
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function getSnapshot() {
	return currentLocale;
}

/** Get the current locale. */
export function getLocale(): Locale {
	return currentLocale;
}

/** Set the locale and persist to localStorage. */
export function setLocale(locale: Locale) {
	if (currentLocale === locale) return;
	currentLocale = locale;
	if (typeof window !== "undefined") {
		try {
			localStorage.setItem(STORAGE_KEY, locale);
		} catch {
			// localStorage unavailable
		}
		// Update document lang attribute
		document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
	}
	notifyListeners();
}

/** Toggle between en and zh. */
export function toggleLocale() {
	setLocale(currentLocale === "en" ? "zh" : "en");
}

/** Translate a key with optional parameters. */
export function t(key: string, params?: TranslationParams): string {
	const template = translations[currentLocale]?.[key] ?? translations.en[key] ?? key;
	if (!params) return template;

	let result = template;
	for (const [paramKey, paramValue] of Object.entries(params)) {
		result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
	}
	return result;
}

/** React hook for translations. Returns { t, locale, setLocale, toggleLocale }. */
export function useTranslation() {
	const locale = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	const translate = useCallback(
		(key: string, params?: TranslationParams) => {
			const template = translations[locale]?.[key] ?? translations.en[key] ?? key;
			if (!params) return template;
			let result = template;
			for (const [paramKey, paramValue] of Object.entries(params)) {
				result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
			}
			return result;
		},
		[locale],
	);

	const changeLocale = useCallback((newLocale: Locale) => setLocale(newLocale), []);
	const toggle = useCallback(() => toggleLocale(), []);

	return { t: translate, locale, setLocale: changeLocale, toggleLocale: toggle };
}

/** React hook for just the locale and setter. */
export function useLocale() {
	const locale = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	const changeLocale = useCallback((newLocale: Locale) => setLocale(newLocale), []);
	const toggle = useCallback(() => toggleLocale(), []);
	return { locale, setLocale: changeLocale, toggleLocale: toggle };
}
