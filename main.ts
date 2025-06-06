import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	setIcon,
	PluginSettingTab,
	Setting,
	View,
} from "obsidian";

// Remember to rename these classes and interfaces!

function debounce(func: (...args: any[]) => void, delay: number) {
	let timeoutId: number | undefined;
	return (...args: any[]) => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}
		timeoutId = window.setTimeout(() => {
			func(...args);
		}, delay);
	};
}

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class CanvasIconReplacer extends Plugin {
	settings: MyPluginSettings;

	onload() {
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				const canvasView = this.getActiveCanvasView();
				if (canvasView) {
					// this.observeCanvasChanges(canvasView);
					this.replaceMinimapWithIcon();
				}
			})
		);
	}

	getActiveCanvasView() {
		const activeLeaf = this.app.workspace.getMostRecentLeaf();
		if (
			activeLeaf &&
			activeLeaf.view &&
			activeLeaf.view.containerEl.querySelector(".canvas-wrapper")
		) {
			return activeLeaf.view;
		}
		return null;
	}

	// observeCanvasChanges(canvasView: View) {
	// 	const checkAndObserve = () => {
	// 		const target =
	// 			canvasView.containerEl.querySelector(".canvas-wrapper");
	// 		if (target) {
	// 			const debouncedReplace = debounce(() => {
	// 				this.replaceMinimapWithIcon();
	// 			}, 300); // Adjust the delay as needed

	// 			const observer = new MutationObserver(() => {
	// 				debouncedReplace();
	// 			});

	// 			observer.observe(target, {
	// 				childList: true,
	// 				subtree: true,
	// 			});

	// 			this.register(() => observer.disconnect());
	// 		} else {
	// 			// Retry after a short delay
	// 			setTimeout(checkAndObserve, 100);
	// 		}
	// 	};

	// 	checkAndObserve();
	// }

	replaceMinimapWithIcon() {
		//get iconic plugin
		const iconicPlugin = (this.app as any).plugins.plugins["iconic"];

		if (!iconicPlugin) {
			console.warn("Iconic plugin not found.");
			return;
		}
		//get iconic setings
		const iconicSettings = iconicPlugin.settings;
		if (!iconicSettings) {
			console.warn("Iconic settings not loaded.");
			return;
		}

		function getFullPathFromFilename(
			filename: string,
			fileIcons: Record<string, any>
		): string | null {
			for (const path in fileIcons) {
				if (path.endsWith(`/${filename}`) || path === filename) {
					return path;
				}
			}
			return null;
		}

		// loop through all canvas nodes in the workspace
		const canvasNodes = document.querySelectorAll(".canvas-node");

		canvasNodes.forEach((node: HTMLElement) => {
			if (node.hasAttribute("data-portal-to-file")) return;

			const canvasEmbed = node.querySelector(
				".canvas-embed"
			) as HTMLElement;
			if (!canvasEmbed) return;

			//check if there's a canvas-icon-replacement already
			const iconReplacement = node.querySelector(
				".canvas-icon-replacement"
			);
			if (iconReplacement) return;

			// Get the filename
			const label = node.querySelector(".canvas-node-label");
			if (!label) return;
			const filename = label?.textContent?.trim();
			if (!filename) return;
			const fullPath = getFullPathFromFilename(
				filename,
				iconicSettings.fileIcons
			);

			let fileIconData;

			if (fullPath) {
				fileIconData = iconicSettings.fileIcons[fullPath];
			}

			if (filename.endsWith(".canvas")) {
				label.textContent = filename.replace(/\.canvas$/, "");
			}

			const iconElement = document.createElement("div");
			iconElement.className = "canvas-icon-replacement";
			canvasEmbed.appendChild(iconElement);

			const iconName = fileIconData?.icon || "lucide-layout-dashboard";
			const iconColor = fileIconData?.color;

			setIcon(iconElement, iconName);
			if (iconColor)
				canvasEmbed.style.backgroundColor = `var(--color-${iconColor})`;

			//add div with filename
			const textElement = document.createElement("div");
			textElement.className = "canvas-title";
			textElement.appendText(filename.replace(".canvas", ""));
			canvasEmbed.appendChild(textElement);
		});
	}
}
export class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
