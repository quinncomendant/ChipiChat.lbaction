//
// Copyright 2023 Quinn Comendant
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

class Help {
    general() {
        const response = LaunchBar.alert('ChipiChat: LaunchBar 🥂 ChatGPT', `Interact with ChatGPT and receive responses as LaunchBar items. Conversation history is preserved for context (up to ${config.get('max_history_tokens')} tokens and ${config.get('max_history_minutes')} minutes). Responses are cached on disk.

Send a message, question, or instruction to Chat GPT and quickly obtain and manipulate responses, LaunchBar-style:

✨  ⌘C  Copy the response to the clipboard.
✨  ⌘Y  QuickLook the response.
✨  ↵ (return)  Open the response as a .md file in your text editor.
✨  → (right-arrow)  Browse the response as a list (ideal for copying only needed lines).
✨  ⇥ (tab)  Send the text to other LaunchBar targets.

Prefix your message with one-or-more modifiers for enhanced functionality:

✏️  N.N: Set temperature to adjust response randomness, e.g., “1.5 why is the sky blue?”.
✏️  copy: Automatically copy the response to the clipboard.
✏️  code: Use the coder persona for code-only responses.
✏️  gpt4: Use the GPT-4 model (requires GPT-4 API access).
✏️  new: Start a new conversation with no history.
✏️  write: Use the copywriter persona, adhering to Orwell’s six rules for writers.

You can combine modifiers, e.g., “code copy 4 js function to get a uuid” sends “js function to get a uuid” to GPT-4 API with the code persona and copies the response. All modifiers must go before your message.

Manage history and settings with special commands:

⚡️ clear: Remove chat history without sending a message.
⚡️ config: Show all configuration settings.
⚡️ configset KEY VALUE: Set the configuration KEY to VALUE.
⚡️ help: Display this help message.
⚡️ history: Display chat history.


⎯
ChipiChat was created by by Quinn Comendant – https://twitter.com/com

`, 'Close', '☕️ Support me on Ko-fi');
        switch (response) {
        case 1:
            LaunchBar.openURL('https://ko-fi.com/strangecode')
            break;
        }
    }

    apiKey() {
        const response = LaunchBar.alert('ChatGPT requires an OpenAI API key', `1. Create an OpenAI account at https://platform.openai.com/signup.
2. Add a credit card in Account → Billing → Payment methods.
3. Get an API key at https://platform.openai.com/account/api-keys.
4. Invoke ChipiChat and enter this command to save your API key in LaunchBar:

👉    configset api_key sk-×××××××××××××××××××…
`, 'Close', 'Open URL for API key', 'Open URL to create account');

        switch (response) {
        case 1:
            LaunchBar.openURL('https://platform.openai.com/account/api-keys')
            break;
        case 2:
            LaunchBar.openURL('https://platform.openai.com/signup')
            break;
        }
    }

    config() {
        const response = LaunchBar.alert('ChipiChat configuration', `To change any of the following values, use the “configset” command, e.g., “configset system_prompt_text You are a helpful but sarcastic assistent”.\n\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n${config.show()}`, 'Close');
    }
}