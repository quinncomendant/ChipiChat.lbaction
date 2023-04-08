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

class OpenAI {
    chat(input_text, output_filename) {
        LaunchBar.debugLog(`Input text: ${input_text}`);

        if (typeof input_text !== 'string' || !input_text.trim().length) {
            LaunchBar.alert('No input text was passed to ChipiChat');
            return;
        }

        let api_key = config.get('api_key');
        let max_tokens = config.get('max_tokens');
        let model = config.get('model');
        let system_message = config.get('system_message');
        let user_message_addendum = config.get('user_message_addendum');
        let temperature = config.get('temperature');
        let max_history_minutes = config.get('max_history_minutes');
        let max_history_tokens = config.get('max_history_tokens');
        let timeout = config.get('timeout');

        input_text = input_text.trim();
        const input_text_with_modifiers = input_text;
        let postprocessing = [];
        let reprefix = []

        // Modifiers customizes ChatGPT's behavior.
        let x = input_text.replace(/[^\x00-\x7F]/g, '').toLowerCase().split(' ').some(modifier => {
            // The some(=>) function exits on the first `return true`, e.g., on the first non-modifier word.
            switch (modifier) {
            case '0.0': case '0.1': case '0.2': case '0.3': case '0.4': case '0.5': case '0.6': case '0.7': case '0.8': case '0.9': case '1.0': case '1.1': case '1.2': case '1.3': case '1.4': case '1.5': case '1.6': case '1.7': case '1.8': case '1.9': case '2.0':
                // Set temperature
                temperature = parseFloat(modifier);
                input_text = util.unprefix(input_text);
                break;

            case '4':
            case 'gpt4':
                // Use GPT-4.
                model = 'gpt-4';
                input_text = util.unprefix(input_text);
                break;

            case 'amnesia':
                // Exclude conversation history for this message.
                max_history_minutes = 0;
                input_text = util.unprefix(input_text);
                break;

            case 'code':
                // Output only code. Markdown code blocks will be removed later.
                system_message = 'You are an assistent to a senior software engineer. Write code only, no description or explanation besides code comments. If the code is more than 3 lines long, add comments to the code. Be succinct. Limit prose.';
                input_text = util.unprefix(input_text);
                reprefix.push(modifier);
                break;

            case 'config':
                // The user is lost.
                LaunchBar.alert(`Are you looking for the “configset” and “configreset” commands? If you need help send the “help” command.`);
                return true;

            case 'copy':
                // Copy the response to the clipboard.
                postprocessing.push('copy-to-clipboard');
                input_text = util.unprefix(input_text);
                break;

            case 'list':
                // Always create a bulleted list.
                user_message_addendum = `Respond with a bulleted list. ${user_message_addendum}`;
                input_text = util.unprefix(input_text);
                reprefix.push(modifier);
                break;

            case 'new':
                // Erase conversation history and start a new chat.
                history.clear();
                input_text = util.unprefix(input_text);
                break;

            case 'write':
                // Writing persona
                postprocessing.push('remove-markdown');
                system_message = `You are a professional copywriter. Write using the following rules: avoid clichés and figures of speech, use short words, cut unnecessary words, prefer the active voice.`;
                user_message_addendum = '';
                input_text = util.unprefix(input_text);
                reprefix.push(modifier);
                break;

            default:
                LaunchBar.debugLog(`Done scanning modifiers`);
                return true;
            }

            LaunchBar.debugLog(`Scanned modifier: ${modifier}`);
            return false;
        });
        input_text = `${reprefix.join(' ')} ${input_text}`;

        // Respond with cached response.
        const cached_response_text = history.getAssistantResponse(input_text_with_modifiers, 3600);
        if (typeof cached_response_text !== 'undefined' && str.split(' ').length > 4) {
            LaunchBar.debugLog(`Using cached response: ${cached_response_text}`);
            return cached_response_text;
        }

        // Build chat completion messages.
        let messages = [{role: 'system', content: system_message}];
        // Include previous non-stale exchanges.
        history.get(max_history_minutes, max_history_tokens).forEach(exchange => {
            messages.push({role: 'user', content: exchange.user});
            messages.push({role: 'assistant', content: exchange.assistant});
        });
        messages.push({role: 'user', content: `${/[.,;:!?]$/.test(input_text) ? input_text : input_text + '.'} ${user_message_addendum}`});

        LaunchBar.debugLog(`Request: ${JSON.stringify(messages)}`);

        if (!api_key.length) {
            help.apiKey();
            return;
        }

        if (/^gpt-4/.test(model)) {
            timeout = 120;
        }

        let result = HTTP.postJSON('https://api.openai.com/v1/chat/completions', {
            headerFields: {'Authorization': `Bearer ${api_key}`},
            resultType: 'json',
            timeout,
            body: {model, temperature, max_tokens, messages}
        });
        if (typeof result.data !== 'undefined') {
            LaunchBar.debugLog(`Response: ${JSON.stringify(result.data)}`);
            if (typeof result.data.error !== 'undefined') {
                LaunchBar.alert(`API request failed: ${result.data.error.message}`);
                return;
            }
            if (typeof result.data.choices === 'undefined' || !result.data.choices.length || !result.data.choices[0].message.content.length) {
                LaunchBar.alert(`Empty response from API.`);
                return;
            }

            let response_text = result.data.choices[0].message.content.trim();

            // Save the conversation history to include in future instructions.
            history.add(input_text_with_modifiers, input_text, response_text);

            // Post-processes lines.
            postprocessing.forEach(action => {
                switch (action) {
                case 'copy-to-clipboard':
                    LaunchBar.displayNotification({title: 'Copied to clipboard:', string: response_text});
                    LaunchBar.setClipboardString(response_text);
                    break;
                }
            });

            return response_text;
        } else if (typeof result.error !== 'undefined') {
            LaunchBar.debugLog(`Response error: ${JSON.stringify(result.error)}`);
            LaunchBar.alert('LaunchBar error', result.error);
        } else {
            LaunchBar.debugLog(`Unknown error: ${JSON.stringify(result)}`);
            LaunchBar.alert('An unknown error occurred');
        }
    }
}
