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

include('lib/config.js');
// Some default values may be overridden by modifiers.
const config = new Config({
    api_key: '',
    model: 'gpt-3.5-turbo',
    // Set the overall behavior of the assistant.
    system_prompt_text: "You are a helpful assistant to an expert audience. Be succinct. Limit prose. Never repeat the prompt. Never apologize. Never write “As an AI language model…”.",
    // Text to include with every message, because `gpt-3.5-turbo-0301` does not always pay attention to system messages.
    user_prompt_addendum: "(Be succinct. Limit prose. Never repeat the prompt.)",
    temperature: 0,
    max_tokens: 1024,
    max_history_minutes: 480,
    max_history_tokens: 500,
    timeout: 15,
});

include('lib/history.js');
const history = new History();

include('lib/help.js');
const help = new Help();

include('lib/util.js');
const util = new Util();

include('lib/openai.js');
const openai = new OpenAI();

// This is the returned item's `action` function (enter key).
function openFile(filename) {
    LaunchBar.hide();
    LaunchBar.openURL(File.fileURLForPath(filename));
}

// This function is called by LaunchBar when the user passes text to the action.
function runWithString(argument) {
    // Commands
    switch (argument.trim().toLowerCase()) {
    case 'config':
        help.config();
        return;

    case 'clear':
        history.clear();
        LaunchBar.displayNotification({string: 'ChipiChat conversation history erased'});
        return;

    case 'help':
        help.general();
        return;
    }

    // Update config
    if (argument.trim().split(' ')[0].toLowerCase() === 'configset') {
        const [_, config_key, ...rest] = argument.split(' ');
        const config_val = rest.join(' ');
        config.set(config_key, config_val);
        return;
    }

    const output_filename = `/tmp/chipichat/${util.slug(argument)}.md`;
    const response_text = openai.chat(argument, output_filename);
    if (typeof response_text === 'string') {
        // Save to a temporary file to open via QuickLook or text editor.
        util.saveFile(output_filename, response_text);
        // Return the full text as the title, with children for each line, hitting ↵ will open the saved text file.
        return {
            title: response_text,
            children: response_text.split('\n').filter(line => !line.includes('```')).map(line => ({ title: line})),
            action: 'openFile',
            actionArgument: output_filename,
            quickLookURL: File.fileURLForPath(output_filename),
            icon: 'ChipiChat-bw.png'
        };
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
    if (typeof argument === 'string') {
        return runWithString(argument);
    }
    LaunchBar.alert(`ChipiChat doesn’t know how to handle this type of input: ${JSON.stringify(argument)}`);
}
