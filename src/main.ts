import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import { registerPasteHandler } from './paste-handler';
import {
	DEFAULT_SETTINGS,
	SafeMathPasteSettingTab,
	type SafeMathPasteSettings,
} from './settings';

export default class SafeMathPastePlugin extends Plugin {
	settings!: SafeMathPasteSettings;
	private skipNextPaste = false;

	async onload(): Promise<void> {
		await this.loadSettings();

		registerPasteHandler(this);
		registerCommands(this);
		this.addSettingTab(new SafeMathPasteSettingTab(this.app, this));
	}

	requestPasteBypass(): void {
		this.skipNextPaste = true;
	}

	consumePasteBypass(): boolean {
		if (!this.skipNextPaste) return false;
		this.skipNextPaste = false;
		return true;
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<SafeMathPasteSettings>,
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
