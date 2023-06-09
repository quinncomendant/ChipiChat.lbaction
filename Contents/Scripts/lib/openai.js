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
class OpenAI {
    chat() {
        let timeout = config.get('timeout');
        if (/^gpt-4/.test(parse.get('model'))) {
            timeout += 120;
            LaunchBar.displayNotification({title: 'ChipiChat', string: 'Message sent. GPT-4 is slow; please have patience!'});
        }
        const request_body = {
            model: parse.get('model'),
            temperature: parse.get('temperature'),
            messages: parse.get('messages'),
            max_tokens: config.get('max_response_tokens') < Infinity ? config.get('max_response_tokens') : null
        };
        LaunchBar.debugLog(`Request: ${JSON.stringify(request_body)}`);
        let result = HTTP.postJSON('https://api.openai.com/v1/chat/completions', {
            headerFields: {'Authorization': `Bearer ${config.get('api_key')}`},
            resultType: 'json',
            timeout,
            body: request_body
        });
        if (typeof result.data !== 'undefined') {
            LaunchBar.debugLog(`Response: ${JSON.stringify(result.data)}`);
            if (typeof result.data.error !== 'undefined') {
                LaunchBar.alert('The request to ChatGPT failed', result.data.error.message);
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

    image() {
        const request_body = {
            n: 1,
            prompt: parse.get('user_message'),
            size: '1024x1024',
            response_format: 'url'
        };
        LaunchBar.debugLog(`Request: ${JSON.stringify(request_body)}`);
        let result = HTTP.postJSON('https://api.openai.com/v1/images/generations', {
            headerFields: {'Authorization': `Bearer ${config.get('api_key')}`},
            resultType: 'json',
            timeout: 30,
            body: request_body
        });
        if (typeof result.data !== 'undefined') {
            LaunchBar.debugLog(`Response: ${JSON.stringify(result.data)}`);
            if (typeof result.data.error !== 'undefined') {
                LaunchBar.alert('The request to DALL·E failed', result.data.error.message);
                return;
            }
            if (!result.data.data.length || typeof result.data.data[0].url === 'undefined') {
                LaunchBar.alert('The response from DALL·E was empty.');
                return '';
            }
            return result.data.data[0].url;
        } else if (typeof result.error !== 'undefined') {
            LaunchBar.debugLog(`Response error: ${JSON.stringify(result.error)}`);
            LaunchBar.alert('LaunchBar error', result.error);
        } else {
            LaunchBar.debugLog(`Unknown error: ${JSON.stringify(result)}`);
            LaunchBar.alert('An unknown error occurred');
        }
    }
}
