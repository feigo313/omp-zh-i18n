import { afterEach, describe, expect, it } from "bun:test";
import { setTuiLanguageProvider, setTuiTranslator, tuiLanguage, tuiT } from "@oh-my-pi/pi-tui/i18n-host";

afterEach(() => {
	setTuiTranslator(null);
	setTuiLanguageProvider(null);
});

describe("TUI i18n host", () => {
	it("returns the English fallback when no host is registered", () => {
		expect(tuiT("ui.loading", "Loading...")).toBe("Loading...");
		expect(tuiT("ui.count", "{count} items", { count: 2 })).toBe("2 items");
		expect(tuiLanguage()).toBe("en");
	});

	it("uses the host translator and language provider", () => {
		setTuiTranslator((key, fallback, params) =>
			key === "ui.loading" ? `加载中${params?.count ? `：${params.count}` : ""}` : fallback,
		);
		setTuiLanguageProvider(() => "zh");

		expect(tuiT("ui.loading", "Loading...", { count: 2 })).toBe("加载中：2");
		expect(tuiLanguage()).toBe("zh");
	});
});
