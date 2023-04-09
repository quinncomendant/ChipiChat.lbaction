//
// ChipiChat – a LaunchBar Action to interact with OpenAI's chat completions API.
// https://github.com/quinncomendant/ChipiChat.lbaction
//
// Requires an OpenAI API key from https://platform.openai.com/account/api-keys
// Enter this command in ChipiChat to set your API key:
//  ┌─────────────────────────────────────────────┐
//  │ configset api_key sk-×××××××××××××××××××    │
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

const version = 'v1.0.0';

include('lib/config.js');
// Some default values may be overridden by modifiers.
const config = new Config({
    api_key: '',
    cache_expiration_minutes: 5,
    cache_min_words: 3,
    default_action: 'open',
    filename_extension: 'txt', // Change this to 'md' if you use a Quick Look extension that supports markdown.
    max_history_minutes: 480,
    max_history_tokens: 500,
    max_tokens: 1024,
    model: 'gpt-3.5-turbo',
    system_message: "You are a helpful assistant to an expert audience. Be succinct. Limit prose. Never repeat the user message. Never apologize. Never write “As an AI language model”.",
    temperature: 0.1,
    timeout: 15,
    user_message_addendum: "Be succinct. Limit prose. Never repeat the user message.",
});

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
        return;

    case 'quicklook':
        LaunchBar.openQuickLook(File.fileURLForPath(filename));
        return;

    case 'insert':
        LaunchBar.paste(File.readText(filename));
        LaunchBar.hide();
        return;

    case 'largetype':
        LaunchBar.displayInLargeType({string: File.readText(filename)});
        LaunchBar.hide();
        return;

    default:
        LaunchBar.alert(`No default action configured`, `To set a default action, run:\n\nconfigset default_action NAME\n\nWhere NAME is one of: open, insert, quicklook, largetype.`);
        return;
    }
}

// This function is called by LaunchBar when the user passes text to the action.
function runWithString(argument) {
    // Commands
    switch (argument.trim().toLowerCase()) {
    case 'config':
        help.config();
        return;

    case 'configreset':
        LaunchBar.displayNotification({title: 'ChipiChat', string: 'Configuration reset to defaults.'});
        config.setDefaults(['api_key']); // Don't reset API key.
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

    // Update config
    if (argument.trim().replace(/\s+/g, ' ').split(' ')[0].toLowerCase() === 'configset') {
        const [_, config_key, ...rest] = argument.split(' ');
        const config_val = rest.join(' ');
        config.set(config_key, config_val);
        return;
    }

    const output_filename = util.filenameFromInputString(argument);
    const response_text = openai.chat(argument, output_filename);
    if (typeof response_text === 'string') {
        // Save to a temporary file to open via Quick Look or text editor.
        util.saveFile(output_filename, response_text);

        if (LaunchBar.options.controlKey) {
            // Quick Look the response document immediately.
            LaunchBar.openQuickLook(File.fileURLForPath(output_filename));
            return util.actionOutput(response_text, output_filename);
        } else if (LaunchBar.options.commandKey) {
            // Open the response document immediately.
            util.openFile(output_filename);
        } else if (LaunchBar.options.shiftKey) {
            // Insert response where the cursor is immediately.
            LaunchBar.paste(response_text);
            LaunchBar.hide();
        } else {
            // Return the full text as the title, with children for each line, hitting ↵ will open the saved text file.
            return util.actionOutput(response_text, output_filename);
        }
    }
}

// This function is called by LaunchBar when the user passes one or more files or folders to the action, either by using the “Open File” dialog or by using Send To.
function runWithPaths(paths) {
    let contents = [];
    paths.forEach(function(path) {
        if (File.isDirectory(path)) {
            LaunchBar.alert('ChipiChat can’t process directories.');
            return;
        }
        if (File.isReadable(path)) {
            try {
                contents.push(File.readText(path));
            } catch (exception) {
                LaunchBar.alert(`Failed to read text file: ${path}`);
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
