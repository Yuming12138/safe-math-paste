import { App, PluginSettingTab, Setting } from 'obsidian';
import type SafeMathPastePlugin from './main';

export interface SafeMathPasteSettings {
	automaticConversion: boolean;
	repairBareDisplayBrackets: boolean;
	showConversionNotice: boolean;
}

export const DEFAULT_SETTINGS: SafeMathPasteSettings = {
	automaticConversion: true,
	repairBareDisplayBrackets: true,
	showConversionNotice: false,
};

export class SafeMathPasteSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: SafeMathPastePlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Convert math on paste')
			.setDesc(
				'Convert \\(...\\) and \\[...\\] math delimiters when text is pasted into an editor.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.automaticConversion)
					.onChange(async (value) => {
						this.plugin.settings.automaticConversion = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Repair stripped display brackets')
			.setDesc(
				'Repair standalone [ ... ] blocks only when their contents have strong LaTeX signals. Ordinary Markdown links and brackets are left unchanged.',
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.repairBareDisplayBrackets)
					.onChange(async (value) => {
						this.plugin.settings.repairBareDisplayBrackets = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Show conversion notice')
			.setDesc('Show a short notice after a paste was changed.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showConversionNotice)
					.onChange(async (value) => {
						this.plugin.settings.showConversionNotice = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
