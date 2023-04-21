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
const config = new Config({
    api_key: '',
    cache_enable: 'true', // Not a boolean.
    cache_expiration_minutes: 15,
    cache_min_words: 3,
    default_action: 'open',
    default_action_auto: 'false', // Not a boolean.
    filename_extension: 'txt',
    hide: 'false', // Not a boolean.
    history_expiration_days: 7,
    max_history_minutes: 480,
    max_history_tokens: 1000,
    max_response_tokens: Infinity,
    model: 'gpt-3.5-turbo',
    temperature: 0.1,
    timeout: 30
});

include('lib/persona.js');
include('persona_defaults.js');
const persona = new Persona(persona_defaults);

include('lib/parse.js');
const parse = new Parse();

include('lib/history.js');
const history = new History();

include('lib/help.js');
const help = new Help();

include('lib/util.js');
const util = new Util();

include('lib/openai.js');
const openai = new OpenAI();

// This function must remain global. It is the returned item's `action` function (return key).
function defaultAction(filename) {
    let action = config.get('default_action');
    const assistant_message = File.readText(filename);

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
        LaunchBar.paste(assistant_message);
        LaunchBar.hide();
        return;

    case 'quicklook':
        LaunchBar.openQuickLook(File.fileURLForPath(filename));
        // For some reason Quick Look doesn't open if there is no action output.
        return util.actionOutput(assistant_message, filename);

    case 'alert':
        const alert_action_response = LaunchBar.alert('ChipiChat', assistant_message, 'Reply', 'Close');
        switch (alert_action_response) {
        case 0:
            LaunchBar.performAction('ChipiChat'); // Including a second argument to performAction() will crash LaunchBar; this bug has been reported.
            break;
        }
        return;

    case 'copy':
        LaunchBar.setClipboardString(assistant_message);
        LaunchBar.displayNotification({title: 'Copied to clipboard', string: assistant_message});
        return;

    case 'largetype':
        LaunchBar.displayInLargeType({string: assistant_message});
        LaunchBar.hide();
        return;

    default:
        LaunchBar.alert('No default action configured', 'To set a default action, use the command:\n\n“config set default_action NAME”\n\nWhere NAME is one of: open, insert, quicklook, alert, copy, largetype.');
        return;
    }
}

// This function is called by LaunchBar when the user passes text to the action.
function runWithString(argument) {
    // Parse the user input.
    parse.process(argument.trim().replace(/[^\S\r\n]+/g, ' '));

    // If a command was entered, run it.
    if (parse.get('command')) {
        return parse.get('command');
    }

    // No input entered, or the user declined to use content from the clipboard.
    if (!parse.get('user_message')) {
        return;
    }

    // Submit the request to ChatGPT if a cached response is not available.
    let assistant_message;
    if (config.get('cache_enable') === 'true' && parse.get('input_text').split(' ').length >= config.get('cache_min_words') && history.exists(parse.get('input_text'))) {
        // Get cached response.
        assistant_message = history.get(parse.get('input_text')).assistant;
        LaunchBar.debugLog(`Using cached response: ${assistant_message}`);
    } else {
        // Get response from API.
        if (!config.get('api_key').length) {
            help.apiKey();
            return;
        }
        config.get('hide') === 'true' && LaunchBar.hide();
        switch (parse.get('model')) {
        case 'dall-e':
            assistant_message = openai.image();
            break;
        default:
            assistant_message = openai.chat();
        }
        config.get('hide') === 'true' && LaunchBar.executeAppleScript('tell application "LaunchBar" to activate');
        history.add(parse.get('input_text'), parse.get('user_message'), assistant_message, parse.get('transient'));
    }

    // Do post-processing on the response.
    parse.get('postprocessing').forEach(task => {
        switch (task) {
        case 'copy-to-clipboard':
            LaunchBar.setClipboardString(assistant_message);
            LaunchBar.displayNotification({title: 'Copied to clipboard', string: assistant_message});
            break;
        case 'concatenate-messages':
            assistant_message = `${parse.get('user_message')} ${assistant_message}`;
            break;
        }
    });

    // Save the response to a file and run the action.
    if (typeof assistant_message === 'string') {
        const output_filename = util.filenameFromInputString(parse.get('input_text'));
        util.saveFile(output_filename, assistant_message);
        if (config.get('default_action_auto') === 'true' || LaunchBar.options.controlKey || LaunchBar.options.commandKey || LaunchBar.options.shiftKey) {
            return defaultAction(output_filename);
        }
        return util.actionOutput(assistant_message, output_filename);
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
    LaunchBar.alert(`ChipiChat doesn’t know how to handle this type of input: ${JSON.stringify(argument)}`);
}
