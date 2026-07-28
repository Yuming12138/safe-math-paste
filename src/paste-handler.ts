import { Notice } from 'obsidian';
import type SafeMathPastePlugin from './main';
import { transformMathPaste } from './transform';

export function registerPasteHandler(plugin: SafeMathPastePlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on('editor-paste', (event, editor) => {
			if (event.defaultPrevented || !plugin.settings.automaticConversion) return;
			if (plugin.consumePasteBypass()) return;

			const clipboardText = event.clipboardData?.getData('text/plain');
			if (!clipboardText) return;

			const result = transformMathPaste(clipboardText, {
				repairBareDisplayBrackets:
					plugin.settings.repairBareDisplayBrackets,
			});
			if (!result.changed) return;

			event.preventDefault();
			editor.replaceSelection(result.text);

			if (plugin.settings.showConversionNotice) {
				const total =
					result.stats.inlineMath +
					result.stats.displayMath +
					result.stats.repairedBareDisplayMath;
				new Notice(`Converted ${total} math expression${total === 1 ? '' : 's'}.`);
			}
		}),
	);
}
