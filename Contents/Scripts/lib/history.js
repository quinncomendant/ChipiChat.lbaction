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

    add(input_text_with_modifiers, input_text, response_text) {
        const exchange = {
            date: new Date().toISOString(),
            input_text_with_modifiers: input_text_with_modifiers,
            user: input_text,
            assistant: response_text
        };
        // Exclude useless responses.
        if (exchange.assistant.includes(`I don't have enough context to answer your question.`)) {
            exchange.assistant = '';
        }
        if (/(as an ai language model|i am a language model)/i.test(exchange.assistant)) {
            exchange.assistant = exchange.assistant.replace(/^[^.]*(as an ai language model|i am a language model)[^.]*\./i, '').trim();
        }
        if (/^sorry, I (cannot|can.t)/i.test(exchange.assistant)) {
            exchange.assistant = exchange.assistant.replace(/^sorry, I (cannot|can.t) [^\.]+\./i, '').trim();
        }
        Action.preferences.conversation_history.unshift(exchange);
    }

    getAssistantResponse(input_text_with_modifiers, max_age_seconds) {
        max_age_seconds = max_age_seconds ?? 1600000000;
        const exchange = Action.preferences.conversation_history.find(exchange => {
            return exchange.input_text_with_modifiers === input_text_with_modifiers && (new Date() - new Date(exchange.date)) <= max_age_seconds * 1000;
        });
        return typeof exchange !== 'undefined' && exchange.assistant.length ? exchange.assistant : undefined;
    }

    // Return conversation newer than max_age_seconds.
    get(max_age_seconds, max_tokens) {
        // One token generally corresponds to ~4 characters of text for common English text. https://platform.openai.com/tokenizer
        const max_chars = max_tokens * 4;
        let chars = 0;
        return Action.preferences.conversation_history.filter(exchange => {
            const return_val = chars < max_chars && (new Date() - new Date(exchange.date)) <= max_age_seconds * 1000;
            chars += exchange.user.length + exchange.assistant.length;
            LaunchBar.debugLog(`History.get ${return_val ? 'included' : 'excluded'} exchange from ${(new Date() - new Date(exchange.date)) / 1000} secs ago: “${exchange.user}”${chars < max_chars ? '' : ' (exceeded max_chars)'}`);
            return return_val;
        }).reverse();
    }

    show() {
        if (!Action.preferences.conversation_history.length) {
            LaunchBar.alert('ChipiChat history is empty.');
            return;
        }
        return Action.preferences.conversation_history.map(exchange => {
            return {
                title: exchange.assistant,
                subtitle: exchange.user,
                alwaysShowsSubtitle: true,
                children: util.actionOutputChildren(exchange.assistant),
                action: 'defaultAction',
                actionArgument: util.filenameFromInputString(exchange.user),
                quickLookURL: File.fileURLForPath(util.filenameFromInputString(exchange.user)),
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

