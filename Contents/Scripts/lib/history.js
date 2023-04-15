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

class History {
    constructor() {
        if (typeof Action.preferences.conversation_history === 'undefined' || !Action.preferences.conversation_history.length) {
            this.clear();
        }

        // Limit conversation history to one week.
        this.truncate(7 * 24 * 60 * 60);
    }

    clear() {
        Action.preferences.conversation_history = [];
    }

    add(input_text, user_message, assistant_message, transient) {
        // Transform useless responses.
        if (/(as an ai language model|i am a language model)/i.test(assistant_message)) {
            assistant_message = assistant_message.replace(/^[^.]*(as an ai language model|i am a language model)[^.]*\./i, '').trim();
        }
        if (/^sorry, I (cannot|can.t)/i.test(assistant_message)) {
            assistant_message = assistant_message.replace(/^sorry, I (cannot|can.t) [^\.]+\./i, '').trim();
        }

        if (typeof input_text !== 'string' || !input_text.length
        || typeof user_message !== 'string' || !user_message.length
        || typeof assistant_message !== 'string' || !assistant_message.length) {
            LaunchBar.debugLog('history.add: skipping non-string or empty string');
            return;
        }

        Action.preferences.conversation_history.unshift({
            date: new Date().toISOString(),
            input_text: input_text,
            user: user_message,
            assistant: assistant_message,
            transient: transient ?? false
        });
    }

    // Test if history.get() will return a match.
    exists(input_text) {
        return typeof this.get(input_text) !== 'undefined' ? true : false;
    }

    // Get the most recent exchange that matches input_text and is not older than cache_expiration_minutes.
    get(input_text) {
        const exchange = Action.preferences.conversation_history.find(exchange => {
            return exchange.input_text === input_text && (new Date() - new Date(exchange.date)) <= config.get('cache_expiration_minutes') * 60 * 1000;
        });
        return typeof exchange !== 'undefined' ? exchange : undefined;
    }

    // Remove and return the last added exchange.
    pop() {
        return Action.preferences.conversation_history.length ? Action.preferences.conversation_history.pop() : [];
    }

    // Return a list of conversations newer than max_history_minutes and until their length reaches max_history_tokens.
    // Exchanges that are “transient” should not be included as conversation history context.
    list() {
        let tokens = 0;
        return Action.preferences.conversation_history.filter(exchange => {
            const return_val = !exchange.transient && tokens < config.get('max_history_tokens') && (new Date() - new Date(exchange.date)) <= config.get('max_history_minutes') * 60 * 1000;
            if (return_val) {
                tokens += util.countTokens(exchange.user + exchange.assistant);
            }
            LaunchBar.debugLog(`History.get ${return_val ? 'included' : 'excluded'} ${exchange.transient ? 'transient' : 'intransient'} exchange from ${(new Date() - new Date(exchange.date)) / 1000} secs ago: “${exchange.user}”${tokens < config.get('max_history_tokens') ? '' : ' (exceeded max_history_tokens)'}`);
            return return_val;
        }).reverse();
    }

    show() {
        if (!Action.preferences.conversation_history.length) {
            LaunchBar.alert('ChipiChat history is empty.');
            return true;
        }
        return Action.preferences.conversation_history.map(exchange => {
            return {
                title: exchange.assistant,
                subtitle: exchange.user,
                alwaysShowsSubtitle: true,
                children: util.actionOutputChildren(exchange.assistant),
                action: 'defaultAction',
                actionArgument: util.filenameFromInputString(exchange.input_text),
                quickLookURL: File.fileURLForPath(util.filenameFromInputString(exchange.input_text)),
                icon: 'ChipiChat-bw.png'
            };
        });
    }

    // Reduce conversation history to curtail the size of ~/Library/Application Support/LaunchBar/Action Support/com.strangecode.LaunchBar.action.ChipiChat/Preferences.plist
    truncate(history_lifetime_seconds) {
        Action.preferences.conversation_history = Action.preferences.conversation_history.filter(exchange => (new Date() - new Date(exchange.date)) <= history_lifetime_seconds * 1000);
    }

    export(filename) {
        if (!Action.preferences.conversation_history.length) {
            LaunchBar.alert('ChipiChat history is empty.');
            return;
        }
        const now = new Date();
        const export_filename = `~/Downloads/ChipiChat export ${now.toISOString().split('T')[0]}-${Math.round(now.getTime() / 1000)}.${config.get('filename_extension')}`;
        let content = [`# Conversation with ${config.get('model')} exported from ChipiChat ${now.toLocaleString('en-CA')}`];
        content = content.concat(Action.preferences.conversation_history.map(exchange => {
            return `---\n\n**User:** ${exchange.user}\n\n**Assistant:** ${/^```|\n/.test(exchange.assistant) ? `\n\n${exchange.assistant}` : exchange.assistant}`;
        }).reverse());
        if (util.saveFile(export_filename, content.join(`\n\n`))) {
            LaunchBar.displayNotification({
                title: 'ChipiChat',
                string: `Conversation history saved to Downloads. Click here to open.`,
                url: File.fileURLForPath(export_filename)
            });
        }
    }
}

