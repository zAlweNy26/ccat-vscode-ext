import vscode, { languages } from 'vscode';
import { CatClient } from 'ccat-api';


function getModelConfig(ccatConfig: vscode.WorkspaceConfiguration): [string, Object] {
	const name = "LLMOpenAIChatConfig";
	const requestBody = {
			"openai_api_key": ccatConfig.ApiKey
			};
	switch(ccatConfig.ConfigureLanguageModel) {
		case "GPT-3": {
			const name = "LLMOpenAIConfig";
			const requestBody = {
				"openai_api_key": ccatConfig.ApiKey
			};
			break;
		}
		case "Cohere": {
			const name = "LLMCohereConfig";
			const requestBody = {
				"cohere_api_key": ccatConfig.ApiKey
			};
			break;
		}
		case "HuggingFace Hub": {
			const name = "LLMHuggingFaceHubConfig";
			const requestBody = {
				"repo_id": null,
				"huggingfacehub_api_token": ccatConfig.ApiKey
			};
			break;
		}
		case "HuggingFace Endpoint": {
			const name = "LLMHuggingFaceEndpointConfig";
			const requestBody = {
				"endpoint_url": null,
				"huggingfacehub_api_token": ccatConfig.ApiKey
			};
			break;
		}
		case "HuggingFace TextGen Inference": {
			const name = "LLMHuggingFaceTextGenInferenceConfig";
			const requestBody = {
				"inference_server_url": null
			};
			break;
		}
		case "Azure OpenAI Completion Models": {
			const name = "LLMAzureOpenAIConfig";
			const requestBody = {
				"openai_api_key": ccatConfig.ApiKey,
				"openai_api_base": null
			};
			break;
		}
		case "Azure OpenAI Chat Models": {
			const name = "LLMAzureChatOpenAIConfig";
			const requestBody = {
				"openai_api_key": ccatConfig.ApiKey,
				"openai_api_base": null,
				"deployment_name": null
			};
			break;
		}
		case "Anthropic": {
			const name = "LLMAnthropicConfig";
			const requestBody = {
				"anthropic_api_key": ccatConfig.ApiKey
			};
			break;
		}
		case "Google PaLM": {
			const name = "LLMGooglePalmConfig";
			const requestBody = {
				"google_api_key": ccatConfig.ApiKey
			};
			break;
		}
		default:
			const name = "LLMOpenAIChatConfig";
			const requestBody = {
				"openai_api_key": ccatConfig.ApiKey
			};
			return [name, requestBody];
	}
	return [name, requestBody];
}

export function activate(context: vscode.ExtensionContext) {
	// Get extension configuration
	const ccatConfig = vscode.workspace.getConfiguration('CheshireCat');

	// Initialize Cat Client
	const cat = new CatClient({
		baseUrl: ccatConfig.BaseUrl,
		port: ccatConfig.Port,
		ws: {
			onFailed: (err) => {
				vscode.window.showErrorMessage(`Error Code: ${err}`);
			},
			retries: 3
		}
	});

	cat.api.settingsLargeLanguageModel.upsertLlmSetting(
		"LLMOpenAIChatConfig",
		{
			"openai_api_key": ccatConfig.ApiKey
		}
	);

	vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('CheshireCat')) {
			// Get Language Model Name
			// let languageModelName, requestBody = getModelConfig(ccatConfig.ConfigureLanguageModel);
			
			/*
			Per il momento ho fatto quella schifezza che vedi su, ma non funziona molto bene. 
			Se sai un modo migliore cancella tutto e rifai come vuoi. 
			*/
			cat.api.settingsLargeLanguageModel.upsertLlmSetting(
				"LLMOpenAIChatConfig",
				{
					"openai_api_key": ccatConfig.ApiKey
				}
			);
		}
    });

	// Open setup page on activation
	vscode.commands.executeCommand(`workbench.action.openWalkthrough`, `Cheshire-Cat-AI.cheshire-cat-ai#firstInstall`);

	// Command to open extension settings page
	let toSettings = vscode.commands.registerCommand("cheshire-cat-ai.toSettings", () => {
		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:Cheshire-Cat-AI.cheshire-cat-ai');
	});

	// Command to comment the code
	let commentCode = vscode.commands.registerCommand("cheshire-cat-ai.commentCode", () => {
		
		const editor = vscode.window.activeTextEditor;
		const selection = editor?.selection;

		if (selection && !selection.isEmpty) {
			// Get text selection
			const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
			const highlighted = editor.document.getText(selectionRange);

			cat.send(highlighted, {
				use_declarative_memory: false,
				use_procedural_memory: false,
				use_episodic_memory: false
			});
			
			cat.onMessage(data => {
				if (data.error) {
					if ((data as any).valid_code){
						editor.edit(editBuilder => {
							editBuilder.replace(selectionRange, data.content);
						});
					}
					else {
						vscode.window.showErrorMessage("The highlighted text may not be valid code. Try again please");
					}
				}
				else {
					vscode.window.showErrorMessage("Something went wrong. Try again please");
				}
				
			});
		}
	});

	context.subscriptions.push(toSettings);
	context.subscriptions.push(commentCode);
}

export function deactivate() {}
