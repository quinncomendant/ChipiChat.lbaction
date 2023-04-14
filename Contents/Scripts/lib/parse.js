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

class Parse {
    // The private #results object will be populated when process() is run.
    #results = {
        // Input text, provided via LaunchBar input or copied from the clipboard.
        input_text: '',

        // If the user sends a command, this will be returned to LaunchBar as output (mixed).
        command: undefined,

        // The user message is the input text with modifiers removed (string).
        user_message: undefined,

        // The model selected for this input (string).
        model: config.get('model'),

        // The temperature selected for this input (float).
        temperature: config.get('temperature'),

        // The messages selected for this input (array).
        messages: [],

        // Post-processing tasks selected for this input (array).
        postprocessing: [],

        // Transient exchanges do not include previous conversation history with the request, and are not included in subsequent requests (bool).
        transient: false,
    };

    process(input_text) {
        this.#results.command = this.commands(input_text);
        this.#results.user_message = this.modifiers(input_text);
    }

    addMessage(role, content) {
        if (!['system', 'user', 'assistant'].includes(role)) {
            LaunchBar.alert('ChipiChat', `Failed to add message because “${role}” is not a valid role.`);
            return false;
        }
        if (!content.length) {
            LaunchBar.alert('ChipiChat', `Failed to add ${role} message because it was empty.`);
            return false;
        }
        this.#results.messages.push({
            role: role,
            content: content
        });
    }

    get(key) {
        key = key.toLowerCase();
        return typeof this.#results[key] !== 'undefined' ? this.#results[key] : undefined;
    }

    commands(input_text) {
        switch (input_text.replace(/^(config|persona) *(delete|export|list|reset|set ).*$/, '$1$2').trim().toLowerCase()) {
        case 'config':
        case 'configlist':
            help.config();
            return true;

        case 'configreset':
            const configreset_response = LaunchBar.alert('Are you sure?', 'This will erase all configuration options, resetting them to their default values.', 'Cancel', 'Go ahead');
            switch (configreset_response) {
            case 1:
                config.setDefaults(['api_key']); // Don't reset API key.
                LaunchBar.displayNotification({title: 'ChipiChat', string: 'Configuration reset to defaults.'});
                break;
            }
            return true;

        case 'configset':
            const [config_key, ...config_words] = input_text.replace(/^config *set */, '').split(' ');
            const config_val = config_words.join(' ');
            config.set(config_key, config_val);
            return true;

        case 'clear':
            const clear_response = LaunchBar.alert('Are you sure?', 'This will erase all conversation history.', 'Cancel', 'Go ahead');
            switch (clear_response) {
            case 1:
                history.clear();
                LaunchBar.displayNotification({title: 'ChipiChat', string: 'Conversation history erased.'});
                break;
            }
            return true;

        case 'export':
            history.export();
            return true;

        case 'help':
            help.general();
            return true;

        case 'history':
            return history.show();

        case 'persona':
        case 'personalist':
            help.persona();
            return true;

        case 'personadelete':
            persona.unset(input_text.replace(/^persona *delete */, '').trim());
            return true;

        case 'personaexport':
            persona.export();
            return true;

        case 'personareset':
            const personareset_response = LaunchBar.alert('Are you sure?', 'This will erase all personas, resetting them to their default values.', 'Cancel', 'Go ahead');
            switch (personareset_response) {
            case 1:
                persona.setDefaults();
                LaunchBar.displayNotification({title: 'ChipiChat', string: 'Personas reset to defaults.'});
                break;
            }
            return true;

        case 'personaset':
            const [persona_name, ...persona_behavior_words] = input_text.replace(/^persona *set */, '').split(' ');
            const persona_behavior = persona_behavior_words.join(' ');
            persona.set(persona_name, persona_behavior);
            return true;

        case 'version':
            util.versionCheck();
            return true;

        default:
            // No command found, return false so we can continue running ChipiChat.
            return false;
        }
    }

    modifiers(input_text) {
        this.#results.input_text = input_text.replace(/\s+/g, ' ').trim();

        let system_message = persona.get('_default')['system_message'];
        let reprefix = []
        let persona_unspecified = true;

        // Modifiers customizes ChatGPT's behavior.
        this.#results.input_text.replace(/[^\x00-\x7F]/g, '').toLowerCase().split(' ').some(modifier => {
            // The some(=>) function exits on the first `return true`, e.g., on the first non-modifier word.
            switch (modifier) {
            case '0.0': case '0.1': case '0.2': case '0.3': case '0.4': case '0.5': case '0.6': case '0.7': case '0.8': case '0.9': case '1.0': case '1.1': case '1.2': case '1.3': case '1.4': case '1.5': case '1.6': case '1.7': case '1.8': case '1.9': case '2.0':
                // Set temperature
                this.#results.temperature = parseFloat(modifier);
                this.#results.input_text = util.unprefix(this.#results.input_text);
                break;

            case '4':
            case 'gpt4':
                // Use GPT-4.
                this.#results.model = 'gpt-4';
                this.#results.input_text = util.unprefix(this.#results.input_text);
                break;

            case 'copy':
                // Copy the response to the clipboard.
                this.#results.postprocessing.push('copy-to-clipboard');
                this.#results.input_text = util.unprefix(this.#results.input_text);
                break;

            case 'new':
                // Erase conversation history and start a new chat.
                history.clear();
                this.#results.input_text = util.unprefix(this.#results.input_text);
                break;

            case 'redo':
                // Load previous input_text and regenerate the response.
                // This is actually a “command” but must be processed in this step.
                const prev = history.pop();
                if (typeof prev.user !== 'undefined' && prev.user.length && !prev.input_text.includes('redo')) {
                    this.#results.input_text = prev.input_text;
                    return true;
                }
                break;

            default:
                let p = persona.get(modifier);
                if (persona_unspecified && p) {
                    // The user requested an existing persona.
                    system_message = p.system_message;
                    if (typeof p.retain_prefix !== 'undefined' && p.retain_prefix) {
                        reprefix.push(modifier);
                    }
                    if (typeof p.transient !== 'undefined' && p.transient) {
                        this.#results.transient = true;
                    }
                    if (typeof p.postprocessing !== 'undefined' && p.postprocessing.length) {
                        this.#results.postprocessing.push(p.postprocessing);
                    }
                    this.#results.input_text = util.unprefix(this.#results.input_text);
                    persona_unspecified = false;
                    break;
                }

                // Otherwise, exit loop to stop scanning modifiers.
                LaunchBar.debugLog(`Done scanning modifiers`);
                return true;
            }

            // The modifier matched a keyword or persona, continue with the next word.
            LaunchBar.debugLog(`Scanned modifier: “${modifier}”`);
            return false;
        });

        // If no text entered, try to use contents of clipboard.
        if (!this.#results.input_text.trim().length) {
            let clipboard_text = LaunchBar.getClipboardString();
            if (typeof clipboard_text === 'undefined' || !clipboard_text.length) {
                LaunchBar.alert('ChipiChat is sad 🥺', 'No text was entered.');
                return '';
            }
            clipboard_text = clipboard_text.replace(/\s+/g, ' ').trim();
            const clipboard_response = LaunchBar.alert('Send this clipboard text to ChatGPT?', `“${util.truncate(clipboard_text, 1000)}”`, 'Ok', 'Cancel');
            switch (clipboard_response) {
            case 0:
                this.#results.input_text = clipboard_text;
                LaunchBar.debugLog(`Input from clipboard: ${this.#results.input_text}`);
                break;
            case 1:
                return '';
            }
        }

        // Build chat completion messages.
        this.addMessage('system', system_message);

        if (!this.#results.transient) {
            history.list().forEach(exchange => {
                // Include previous non-stale exchanges.
                this.addMessage('user', exchange.user);
                this.addMessage('assistant', exchange.assistant);
            });
        }

        let final_user_message = this.#results.input_text.trim();
        if (util.countTokens(final_user_message) > config.get('max_user_message_tokens')) {
            final_user_message = final_user_message.slice(0, util.characterLengthFromTokens(config.get('max_user_message_tokens')));
            LaunchBar.displayNotification({title: 'ChipiChat', string: `Input text truncated to avoid exceeding max tokens.`});
        }
        this.addMessage('user', final_user_message);

        return final_user_message;
    }
}
