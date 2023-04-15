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

class Persona {
    #defaults = {};

    constructor(defaults) {
        this.#defaults = defaults;
        LaunchBar.debugLog(`Previously saved personas: (${typeof Action.preferences.personas}) ${JSON.stringify(Action.preferences.personas)}`);
        if (typeof Action.preferences.personas === 'undefined' || !Object.keys(Action.preferences.personas).length) {
            this.setDefaults();
        }
    }

    setDefaults() {
        Action.preferences.personas = {};
        Object.entries(this.#defaults).forEach(([key, val]) => {
            LaunchBar.debugLog(`Setting default persona: ${key} = ${val}`);
            Action.preferences.personas[key] = val;
        });
    }

    requireVal(key, val) {
        if (typeof key === 'undefined' || !key.length) {
            LaunchBar.alert(`Failed to set persona`, `Persona name must not be empty.`);
            return false;
        }
        if (typeof val === 'undefined' || !val.length) {
            LaunchBar.alert(`Failed to set persona`, `Persona behavior must not be empty.`);
            return false;
        }
        return true;
    }

    reservedKey(key) {
        key = key.toLowerCase();
        // This list much match the Modifiers processed in lib/openai.js
        const reserved_keywords = [
            '0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '2.0',
            '4', 'amnesia', 'copy', 'gpt4', 'new'
        ];
        if (reserved_keywords.includes(key)) {
            LaunchBar.alert(`Failed to set persona`, `“${key}” is a reserved keyword. Please choose a different name for your new persona.`);
            return false;
        }
        return true;
    }

    set(key, val) {
        key = key.toLowerCase();
        if (!this.requireVal(key, val)) {
            return false;
        }
        if (!this.reservedKey(key)) {
            return false;
        }
        switch (key) {
        case 'default':
            Action.preferences.personas['_default'] = {
                system_message: val,
                retain_prefix: true,
            };
            break;

        default:
            Action.preferences.personas[key] = {
                system_message: val,
                retain_prefix: false,
            };
            break;
        }

        LaunchBar.displayNotification({
            title: 'ChipiChat persona saved',
            string: `“${key}” has been set to “${val}”`
        });
    }

    unset(key) {
        key = key.toLowerCase();
        if (typeof Action.preferences.personas[key] !== 'undefined') {
            Action.preferences.personas.slice(key, 1);
        }
    }

    get(key) {
        key = key.toLowerCase();
        return typeof Action.preferences.personas[key] !== 'undefined' ? Action.preferences.personas[key] : false;
    }

    emoji(persona) {
        const occupational_emoji = ['🧝', '🧑‍⚕️', '🧑‍🎓', '💂', '🧑‍⚖️', '👷', '🕵️', '🧑‍🎨', '🧑‍🌾', '🧟', '🧑‍🍳'];
        let hash = 0;
        for (let i = 0; i < persona.length; i++) {
            hash += persona.charCodeAt(i);
        }
        return occupational_emoji[hash % occupational_emoji.length];
    }

    show() {
        return Object.entries(Action.preferences.personas).sort().map(([key, val]) => {
            if (key === '_default') {
                return `🎭 default (used when no persona is specified): “${val.system_message}”\n`
            }
            const emoji = typeof val.emoji !== 'undefined' ? val.emoji : this.emoji(key);
            const transient_note = typeof val.transient !== 'undefined' && val.transient ? '†' : '';
            return `${emoji} ${key}: ${val.description ? val.description : '“' + util.truncate(val.system_message, 50) + '”'}${transient_note}\n`
        }).join('\n');
    }

    export(filename) {
        const now = new Date();
        const export_filename = `~/Downloads/ChipiChat personas ${now.toISOString().split('T')[0]}-${Math.round(now.getTime() / 1000)}.${config.get('filename_extension')}`;
        let content = [`# Personas exported from ChipiChat ${now.toLocaleString('en-CA')}`];
        content = content.concat(Object.entries(Action.preferences.personas).sort().map(([key, val]) => {
            if (key === '_default') {
                return `## 🎭 Default persona\n\n${val.system_message}`;
            }
            const emoji = typeof val.emoji !== 'undefined' ? val.emoji : this.emoji(key);
            const transient_note = typeof val.transient !== 'undefined' && val.transient ? ' †' : '';
            return `## ${emoji} ${key}${transient_note}\n\n${val.system_message}`;
        }));
        content.push(`---\n† These personas are transient. Messages sent using a transient persona will not include conversation history, and will not be sent in future history. Responses will still be cached.`);
        if (util.saveFile(export_filename, content.join(`\n\n`))) {
            LaunchBar.displayNotification({
                title: 'ChipiChat',
                string: `Personas saved to Downloads. Click here to open.`,
                url: File.fileURLForPath(export_filename)
            });
        }
    }
}
