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
					this.annotateCanvasNodesWithFilenames();
					this.observeCanvasChanges(canvasView);
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

	annotateCanvasNodesWithFilenames() {
		document.querySelectorAll(".canvas-node").forEach((node) => {
			const labelEl = node.querySelector(".canvas-node-label");
			const filename = labelEl?.textContent?.trim();
			if (filename) node.setAttribute("data-filename", filename);
		});
	}

	observeCanvasChanges(canvasView: View) {
		const target = canvasView.containerEl;

		if (!target) return;

		const observer = new MutationObserver(() => {
			this.replaceMinimapWithIcon(canvasView);
			// this.autoArrangeColumn();
		});

		observer.observe(target, {
			childList: true,
			subtree: true,
		});

		this.register(() => observer.disconnect());
	}

	// autoArrangeColumn() {
	// 	const groupLabel = document.querySelector(
	// 		"div.canvas-group-label"
	// 	) as HTMLElement;
	// 	if (!groupLabel) {
	// 		console.warn("⚠️ Group label not found.");
	// 		return;
	// 	}

	// 	// Step 1: Click the group label to activate the group
	// 	groupLabel.click();

	// 	// Step 2: Wait for Align button to appear
	// 	setTimeout(() => {
	// 		const alignBtn = document.querySelector(
	// 			'.clickable-icon[aria-label="Align"]'
	// 		) as HTMLElement;
	// 		if (!alignBtn) {
	// 			console.warn("⚠️ Align button not found.");
	// 			return;
	// 		}

	// 		// Step 3: Click Align
	// 		alignBtn.click();

	// 		// Step 4: Wait for menu to render
	// 		setTimeout(() => {
	// 			const arrangeItems = document.querySelectorAll(
	// 				'[data-section="arrange"] .menu-item'
	// 			);

	// 			arrangeItems.forEach((item) => {
	// 				const text = item.textContent?.trim();
	// 				if (text === "Arrange in a column") {
	// 					(item as HTMLElement).click();
	// 					console.log("✅ Auto-arranged in a column.");
	// 				}
	// 			});
	// 		}, 100); // Inner menu delay
	// 	}, 100); // Align button delay
	// }

	// cleanCanvasNodeLabels() {
	// 	const labels = document.querySelectorAll("div.canvas-node-label");

	// 	labels.forEach((el) => {
	// 		const label = el as HTMLElement; // type assertion
	// 		const text = label.textContent?.trim().toLowerCase();
	// 		if (!text) return;

	// 		if (text.includes("pasted image")) {
	// 			label.style.display = "none";
	// 		} else if (text.endsWith(".canvas")) {
	// 			label.textContent = text.replace(/\.canvas$/, "");
	// 		}
	// 	});
	// }

	// replaceMinimapWithIcon(canvasView: View) {
	// 	const iconicPlugin = (this.app as any).plugins.plugins["iconic"];
	// 	const minimaps =
	// 		canvasView.containerEl.querySelectorAll(".canvas-minimap");
	// 	minimaps.forEach((minimap: HTMLElement) => {
	// 		if (!minimap.classList.contains("icon-replaced")) {
	// 			minimap.style.display = "none";

	// 			// iconicPlugin.settings.fileIcons;
	// 			//canvas-embed

	// 			const iconElement = document.createElement("div");
	// 			iconElement.className = "canvas-icon-replacement";

	// 			// Retrieve the icon name from the view
	// 			const iconName =
	// 				canvasView.getIcon?.() || canvasView.icon || "file";

	// 			// Use Obsidian's setIcon function to insert the SVG
	// 			setIcon(iconElement, iconName);

	// 			minimap.parentElement?.appendChild(iconElement);
	// 			minimap.classList.add("icon-replaced");
	// 		}
	// 	});
	// }
	replaceMinimapWithIcon(canvasView: View) {
		const iconicPlugin = (this.app as any).plugins.plugins["iconic"];
		if (!iconicPlugin) {
			console.warn("Iconic plugin not found.");
			return;
		}

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

		// Loop through all canvas nodes in the workspace
		const canvasNodes = document.querySelectorAll(`[data-filename]`);

		canvasNodes.forEach((node: HTMLElement) => {
			// Get the label element with the file name
			const filename = node.getAttribute("data-filename");
			if (!filename) return;

			const minimap = node.querySelector(
				".canvas-minimap"
			) as HTMLElement;

			if (minimap.classList.contains("icon-replaced")) return;

			const fullPath = getFullPathFromFilename(
				filename,
				iconicSettings.fileIcons
			);

			let fileIconData;

			if (fullPath) {
				fileIconData = iconicSettings.fileIcons[fullPath];
			}

			const iconName = fileIconData?.icon || "dashboard";
			const iconColor = fileIconData?.color; // optional

			if (minimap) {
				minimap.style.display = "none";
				minimap.classList.add("icon-replaced");
			}

			const textElement = document.createElement("div");
			textElement.className = "canvas-title";
			textElement.appendText(filename.replace(".canvas", ""));

			// const observer = new ResizeObserver((elements) => {
			// 	for (const entry of elements) {
			// 		if (entry.contentRect.width < 250) {
			// 			entry.target.classList.add("small");
			// 		} else {
			// 			entry.target.classList.remove("small");
			// 		}
			// 	}
			// });

			// observer.observe(elements);

			// if (textElement.clientWidth < 70) {
			// 	textElement.style.display = "none";
			// }

			const iconElement = document.createElement("div");
			iconElement.className = "canvas-icon-replacement";
			const nodeContainer = node.querySelector(
				".canvas-embed"
			) as HTMLElement;
			if (iconColor)
				nodeContainer.style.backgroundColor = `var(--${iconColor})`;

			setIcon(iconElement, iconName || "file");
			nodeContainer.appendChild(iconElement);
			nodeContainer.appendChild(textElement);
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
