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

// eslint-disable-next-line no-redeclare, no-unused-vars
class Help {
    general() {
        const response = LaunchBar.alert('ChipiChat: LaunchBar🥂ChatGPT', `Interact with the ChatGPT API and receive responses in LaunchBar. Conversation history is preserved for context (up to ${config.get('max_history_tokens')} tokens and ${config.get('max_history_minutes')} minutes). Responses are cached on disk for ${config.get('cache_expiration_minutes')} minutes.

Send a message, question, or instruction to Chat GPT and quickly obtain and manipulate responses, LaunchBar-style:

✨  ⌘↵ (command + return)  Open the response in your text editor.
✨  ⇧↵ (shift + return)  Insert the response at the current cursor position.
✨  ⌃↵ (control + return)  Quick Look the response.
✨  ⌘Y Quick Look the response.
✨  ⌘C Copy the response to the clipboard.
✨  ↵ (return)  Open the response in your text editor (reconfigurable using the 'default_action' config option).
✨  → (right-arrow)  Browse the response as a list (ideal for acting on specific lines of text).
✨  ⇥ (tab)  Send the text to other LaunchBar targets, e.g., send the output to a friend by passing it to the Compose Message action.

Prefix your message with modifiers for enhanced functionality:

🏷️  “(persona name)”: Use a custom or predefined persona.
🏷️  “N.N”: Adjust response randomness by using temperature value “N.N”, e.g., “1.5 why is the sky blue?”.
🏷️  “4”: Use the GPT-4 model (requires GPT-4 API access).
🏷️  “copy”: Automatically copy the response to the clipboard.
🏷️  “image”: Generate an image with DALL·E and return the image URL.
🏷️  “new”: Start a new conversation with no history.
🏷️  “transient”: Exclude conversation history for this message.

You can combine modifiers, e.g., “code copy 4 js uuid function” sends “js uuid function” to GPT-4 API with the code persona and copies the response. All modifiers must go at the beginning of the message.

Manage conversation history, settings, and personas by sending commands:

⚡️  “help”: Display a help message.
⚡️  “history”: Display recent conversation history.
⚡️  “export”: Save conversation history to a file in ~/Downloads/.
⚡️  “cache”: Open the cache directory in the Finder.
⚡️  “clear”: Erase all conversation history (otherwise, conversations are stored up to one week).
⚡️  “config list”: Show current configuration settings.
⚡️  “config reset”: Reset all configuration options to default.
⚡️  “config set OPTION VALUE”: Set the configuration OPTION to VALUE, e.g., “config set default_action alert”.
⚡️  “persona list”: View a summary of personas.
⚡️  “persona export”: Save all personas and their prompts to a file in ~/Downloads/.
⚡️  “persona delete NAME”: Delete a persona.
⚡️  “persona reset”: Reset personas to default. This will erase any custom personas you added.
⚡️  “persona set default SYSTEM_MESSAGE”: Change the default persona’s system message.
⚡️  “persona set NAME SYSTEM_MESSAGE”: Add or modify a persona.
⚡️  “redo”: Regenerate the response using a random temperature between 0–1.
⚡️  “version”: Display ChipiChat version and check if a new version is available.

ChipiChat was created by by Quinn Comendant

`, 'Close', 'View on GitHub', 'Follow on Twitter', '☕️ Support on Ko-fi');
        switch (response) {
        case 1:
            LaunchBar.openURL('https://github.com/quinncomendant/ChipiChat.lbaction');
            break;
        case 2:
            LaunchBar.openURL('https://twitter.com/com');
            break;
        case 3:
            LaunchBar.openURL('https://ko-fi.com/strangecode');
            break;
        }
    }

    apiKey() {
        const response = LaunchBar.alert('ChatGPT requires an OpenAI API key', `1. Create an OpenAI account at https://platform.openai.com/signup.
2. Add a credit card in Account → Billing → Payment methods.
3. Get an API key at https://platform.openai.com/account/api-keys.
4. Invoke ChipiChat and send this command to save your API key in LaunchBar:

👉    config set api_key sk-×××××××××××××××××××
`, 'Close', 'Open URL for API key', 'Open URL to create account');

        switch (response) {
        case 1:
            LaunchBar.openURL('https://platform.openai.com/account/api-keys');
            break;
        case 2:
            LaunchBar.openURL('https://platform.openai.com/signup');
            break;
        }
    }

    config() {
        const response = LaunchBar.alert('ChipiChat configuration', `To change any of the following values, use the “config set” command, e.g., “config set default_action quicklook”.

⎯

${config.show()}`, 'Close', 'View the docs');

        switch (response) {
        case 1:
            LaunchBar.openURL('https://github.com/quinncomendant/ChipiChat.lbaction#options');
            break;
        }
    }

    persona() {
        const response = LaunchBar.alert('ChipiChat personas', `To add or update personas, use the “persona set NAME SYSTEM_MESSAGE” command, e.g., “persona set pierre Translate the following text into French”. Delete a persona with “persona delete NAME”. Revert all personas to default with “persona reset”.

⎯

${persona.show()}

† These personas are transient. Messages sent using a transient persona will not include conversation history, and will not be sent in future history. Responses will still be cached.`, 'Close', 'View the docs', 'Export personas to a file');

        switch (response) {
        case 1:
            LaunchBar.openURL('https://github.com/quinncomendant/ChipiChat.lbaction#personas');
            break;
        case 2:
            persona.export();
            break;
        }
    }
}