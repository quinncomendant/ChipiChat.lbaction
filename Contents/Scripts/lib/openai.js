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
    model = config.get('model');
    temperature = config.get('temperature');
    #messages = [];

    addMessage(role, content) {
        if (!['system', 'user', 'assistant'].includes(role)) {
            LaunchBar.alert('ChipiChat', `Failed to add message because “${role}” is not a valid role.`);
            return false;
        }
        if (!content.length) {
            LaunchBar.alert('ChipiChat', `Failed to add ${role} message because it was empty.`);
            return false;
        }
        this.messages.push({
            role: role,
            content: content
        });
    }

    chat() {
        timeout = config.get('timeout');
        if (/^gpt-4/.test(this.model)) {
            timeout += 60;
            LaunchBar.displayNotification({title: 'ChipiChat', string: 'Message sent. GPT-4 is slow; please have patience!'});
        }
        LaunchBar.debugLog(`Request: ${JSON.stringify(this.messages)}`);
        let result = HTTP.postJSON('https://api.openai.com/v1/chat/completions', {
            headerFields: {'Authorization': `Bearer ${config.get('api_key')}`},
            resultType: 'json',
            timeout,
            body: {
                model: this.model,
                temperature: this.temperature,
                messages: this.messages,
                max_tokens: config.get('max_response_tokens')
            }
        });
        if (typeof result.data !== 'undefined') {
            LaunchBar.debugLog(`Response: ${JSON.stringify(result.data)}`);
            if (typeof result.data.error !== 'undefined') {
                LaunchBar.alert(`The request to ChatGPT failed: ${result.data.error.message}`);
                return;
            }
            if (typeof result.data.choices === 'undefined' || !result.data.choices.length || !result.data.choices[0].message.content.length) {
                LaunchBar.alert('The response from ChatGPT was empty.');
                return '';
            }
            return result.data.choices[0].message.content.trim();
        } else if (typeof result.error !== 'undefined') {
            LaunchBar.debugLog(`Response error: ${JSON.stringify(result.error)}`);
            LaunchBar.alert('LaunchBar error', result.error);
        } else {
            LaunchBar.debugLog(`Unknown error: ${JSON.stringify(result)}`);
            LaunchBar.alert('An unknown error occurred');
        }
    }
}
