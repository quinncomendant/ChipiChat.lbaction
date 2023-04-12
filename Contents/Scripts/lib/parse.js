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
    postprocessing = [];

    commands(input_text) {
        switch (input_text.replace(/^(config|persona) *(export|list|reset|set ).*$/, '$1$2').trim().toLowerCase()) {
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
        input_text = input_text.replace(/\s+/g, ' ').trim();

        let system_message = persona.get('_default')['system_message'];
        let user_message_addendum = persona.get('_default')['user_message_addendum'];
        let reprefix = []

        // Modifiers customizes ChatGPT's behavior.
        let x = input_text.replace(/[^\x00-\x7F]/g, '').toLowerCase().split(' ').some(modifier => {
            // The some(=>) function exits on the first `return true`, e.g., on the first non-modifier word.
            switch (modifier) {
            case '0.0': case '0.1': case '0.2': case '0.3': case '0.4': case '0.5': case '0.6': case '0.7': case '0.8': case '0.9': case '1.0': case '1.1': case '1.2': case '1.3': case '1.4': case '1.5': case '1.6': case '1.7': case '1.8': case '1.9': case '2.0':
                // Set temperature
                openai.temperature = parseFloat(modifier);
                input_text = util.unprefix(input_text);
                break;

            case '4':
            case 'gpt4':
                // Use GPT-4.
                openai.model = 'gpt-4';
                input_text = util.unprefix(input_text);
                break;

            case 'copy':
                // Copy the response to the clipboard.
                this.postprocessing.push('copy-to-clipboard');
                input_text = util.unprefix(input_text);
                break;

            case 'new':
                // Erase conversation history and start a new chat.
                history.clear();
                input_text = util.unprefix(input_text);
                break;

            default:
                let p = persona.get(modifier);
                if (p) {
                    // The user requested an existing persona.
                    system_message = p.system_message;
                    user_message_addendum = p.user_message_addendum;
                    p.retain_prefix && reprefix.push(modifier);
                    input_text = util.unprefix(input_text);
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
        input_text = `${reprefix.join(' ')} ${input_text}`.trim();

        // Build chat completion messages.
        openai.addMessage('system', system_message);

        history.list().forEach(exchange => {
            // Include previous non-stale exchanges.
            openai.addMessage('user', exchange.user);
            openai.addMessage('assistant', exchange.assistant);
        });

        let final_user_message = `${/[.,;:!?]$/.test(input_text) ? input_text : input_text + '.'} ${user_message_addendum}`.trim();
        if (util.countTokens(final_user_message) > config.get('max_user_message_tokens')) {
            final_user_message = final_user_message.slice(0, config.get('max_user_message_tokens'));
            LaunchBar.displayNotification({title: 'ChipiChat', string: `Input text truncated to avoid exceeding max tokens.`});
        }
        openai.addMessage('user', final_user_message);

        return final_user_message;
    }
}
