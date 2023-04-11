//
// ChipiChat – a LaunchBar Action to interact with OpenAI's chat completions API.
// https://github.com/quinncomendant/ChipiChat.lbaction
//
// Requires an OpenAI API key from https://platform.openai.com/account/api-keys
// Enter this command in ChipiChat to set your API key:
//  ┌─────────────────────────────────────────────┐
//  │ config set api_key sk-×××××××××××××××××××   │
//  └─────────────────────────────────────────────┘
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

include('lib/config.js');
// Some default values may be overridden by modifiers.
const config = new Config({
    api_key: '',
    cache_expiration_minutes: 5,
    cache_min_words: 3,
    default_action: 'open',
    default_action_opens_automatically: 'false',
    filename_extension: 'txt', // Change this to 'md' if you use a Quick Look extension that supports markdown.
    max_history_minutes: 480,
    max_history_tokens: 1000,
    max_response_tokens: 2000,
    max_user_message_tokens: 1000,
    model: 'gpt-3.5-turbo',
    system_message: "You are a helpful assistant to an expert audience. Be succinct. Limit prose. Never repeat the user message. Never apologize. Never say “As an AI language model”.",
    temperature: 0.1,
    timeout: 30,
    user_message_addendum: "Be succinct. Limit prose. Never repeat the user message.",
});

// The sum of tokens used for max_user_message_tokens + max_history_tokens + max_response_tokens must not exceed the model's context length.
let model_context_length = 4096;
if (config.get('model').includes('gpt-4')) {
    let model_context_length = 8192;
} else if (config.get('model').includes('gpt-4-32k')) {
    let model_context_length = 32768;
}

include('lib/history.js');
const history = new History();

include('lib/help.js');
const help = new Help();

include('lib/util.js');
const util = new Util();

include('lib/openai.js');
const openai = new OpenAI();

// This function must remain global. It is the returned item's `action` function (enter key).
function defaultAction(filename) {
    let action = config.get('default_action');
    const response_text = File.readText(filename);

    // Override default action if a key is held down.
    if (LaunchBar.options.controlKey) {
        action = 'quicklook';
    } else if (LaunchBar.options.commandKey) {
        action = 'open';
    } else if (LaunchBar.options.shiftKey) {
        action = 'insert';
    }

    switch (action) {
    case 'open':
        util.openFile(filename);
        LaunchBar.hide();
        return;

    case 'insert':
        LaunchBar.paste(response_text);
        LaunchBar.hide();
        return;

    case 'quicklook':
        LaunchBar.openQuickLook(File.fileURLForPath(filename));
        // For some reason Quick Look doesn't open if there is no action output.
        return util.actionOutput(response_text, filename);

    case 'alert':
        const response = LaunchBar.alert('ChipiChat', response_text, 'Reply', 'Close');
        switch (response) {
        case 0:
            LaunchBar.performAction('ChipiChat');
            break;
        }
        return;

    case 'copy':
        LaunchBar.setClipboardString(response_text);
        LaunchBar.displayNotification({title: 'Copied to clipboard', string: response_text});
        return;

    case 'largetype':
        LaunchBar.displayInLargeType({string: response_text});
        LaunchBar.hide();
        return;

    default:
        LaunchBar.alert('No default action configured', 'To set a default action, use the command:\n\n“config set default_action NAME”\n\nWhere NAME is one of: open, insert, quicklook, alert, copy, largetype.');
        return;
    }
}

// This function is called by LaunchBar when the user passes text to the action.
function runWithString(argument) {
    const input_text = argument.trim().replace(/\s+/g, ' ');

    // Commands
    switch (input_text.replace(/^(config) *(reset|set).*$/, '$1$2').toLowerCase()) {
    case 'config':
        help.config();
        return;

    case 'configreset':
        config.setDefaults(['api_key']); // Don't reset API key.
        LaunchBar.displayNotification({title: 'ChipiChat', string: 'Configuration reset to defaults.'});
        return;

    case 'configset':
        const [config_key, ...rest] = input_text.replace(/^config *set */, '').split(' ');
        const config_val = rest.join(' ');
        config.set(config_key, config_val);
        return;

    case 'clear':
        history.clear();
        LaunchBar.displayNotification({title: 'ChipiChat', string: 'Conversation history erased.'});
        return;

    case 'export':
        history.export();
        return;

    case 'help':
        help.general();
        return;

    case 'history':
        return history.show();

    case 'version':
        util.versionCheck();
        return;
    }

    const response_text = openai.chat(input_text);
    const output_filename = util.filenameFromInputString(input_text);
    if (typeof response_text === 'string') {
        util.saveFile(output_filename, response_text);
        if (config.get('default_action_opens_automatically') === 'true') {
            return defaultAction(output_filename);
        }
        return util.actionOutput(response_text, output_filename);
    }
}

// This function is called by LaunchBar when the user passes one or more files or folders to the action, either by using the “Open File” dialog or by using Send To.
function runWithPaths(paths) {
    let contents = [];
    paths.forEach(function(path) {
        if (File.isDirectory(path)) {
            LaunchBar.alert('ChipiChat can’t process directories', path);
            return;
        }
        if (File.isReadable(path)) {
            try {
                contents.push(File.readText(path));
            } catch (exception) {
                LaunchBar.alert('ChipiChat failed to read text file', path);
            }
        }
    });
    if (contents.length) {
        return runWithString(contents.join('\n----\n'));
    }
    return;
}

// This is the default function called by LaunchBar. If the user just runs the action without any argument, or there is an argument but none of the more specific function are implemented, this function will be called.
function run(argument) {
    if (typeof argument === 'undefined') {
        help.general();
        return;
    }
    if (typeof argument === 'string') {
        return runWithString(argument);
    }
    LaunchBar.alert(`ChipiChat doesn’t know how to handle this type of input: ${JSON.stringify(argument)}`);
}
