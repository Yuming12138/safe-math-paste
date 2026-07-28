import { Notice } from 'obsidian';
import type SafeMathPastePlugin from './main';
import { transformMathPaste } from './transform';

export function registerCommands(plugin: SafeMathPastePlugin): void {
	plugin.addCommand({
		id: 'toggle-automatic-conversion',
		name: 'Toggle automatic math conversion',
		callback: async () => {
			plugin.settings.automaticConversion =
				!plugin.settings.automaticConversion;
			await plugin.saveSettings();
			new Notice(
				`Automatic math conversion ${plugin.settings.automaticConversion ? 'enabled' : 'disabled'}.`,
			);
		},
	});

	plugin.addCommand({
		id: 'skip-next-paste',
		name: 'Skip conversion for next paste',
		callback: () => {
			plugin.requestPasteBypass();
			new Notice('The next paste will not be converted.');
		},
	});

	plugin.addCommand({
		id: 'convert-selected-text',
		name: 'Convert math in selected text',
		editorCallback: (editor) => {
			const selection = editor.getSelection();
			if (!selection) {
				new Notice('Select text to convert first.');
				return;
			}

			const result = transformMathPaste(selection, {
				repairBareDisplayBrackets:
					plugin.settings.repairBareDisplayBrackets,
			});
			if (!result.changed) {
				new Notice('No compatible math delimiters found.');
				return;
			}

			editor.replaceSelection(result.text);
		},
	});
}
