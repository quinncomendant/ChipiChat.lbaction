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
class Config {
    #defaults = {};

    constructor(defaults) {
        this.#defaults = defaults;
        LaunchBar.debugLog(`Previously saved config: (${typeof Action.preferences.config}) ${JSON.stringify(Action.preferences.config)}`);
        if (typeof Action.preferences.config === 'undefined' || !Object.keys(Action.preferences.config).length) {
            this.setDefaults();
        }

        if (!this.get('api_key').length) {
            // Try to get api_key from shell environment variable OPENAI_API_KEY.
            // The get_api_key.sh script just echos the OPENAI_API_KEY defined in the shell environment.
            const api_key_env = LaunchBar.execute(`./get_api_key.sh`).trim();
            if (/^sk-/.test(api_key_env)) {
                this.set('api_key', api_key_env);
            }
        }
    }

    setDefaults(keys_to_retain=[]) {
        let retained_options = {};
        keys_to_retain.forEach(key => {
            retained_options[key] = this.get(key);
        });
        Action.preferences.config = retained_options;
        Object.entries(this.#defaults).forEach(([key, val]) => {
            if (!keys_to_retain.includes(key)) {
                LaunchBar.debugLog(`Setting default config: “${key}” = “${val}”`);
                Action.preferences.config[key] = val;
            }
        });
    }

    requireVal(key, val) {
        if (typeof val === 'undefined' || !val.length) {
            LaunchBar.alert(`Failed to set configuration`, `“${key}” must not be empty.`);
            return false;
        }
        return true;
    }

    requireValidOption(key, val, valid_options) {
        if (!valid_options.includes(val)) {
            LaunchBar.alert(`Failed to set configuration`, `“${key}” must contain one of the following values:\n\n${valid_options.join('\n')}`);
            return false;
        }
        return true;
    }

    requireInt(key, val) {
        if (!/^\d+$/.test(val)) {
            LaunchBar.alert(`Failed to set configuration`, `“${key}” must be an integer.`);
            return false;
        }
        return true;
    }

    set(key, val) {
        switch (key) {
        case 'api_key':
            if (!this.requireVal(key, val)) {
                return false;
            }
            if (!/^sk-\w{45,}/.test(val)) {
                LaunchBar.alert(`Failed to set configuration`, `Not a valid API key (OpenAI API keys start with “sk-”).`);
                return false;
            }
            Action.preferences.config[key] = val;
            if (key === 'api_key') {
                val = `${val.substring(0, 7)}…`;
            }
            break;

        case 'default_action':
            if (!this.requireValidOption(key, val, ['open', 'insert', 'quicklook', 'alert', 'copy', 'largetype'])) {
                return false;
            }
            Action.preferences.config[key] = val;
            break;

        case 'cache_enable':
        case 'default_action_auto':
        case 'hide':
            if (!this.requireValidOption(key, val, ['true', 'false'])) {
                return false;
            }
            Action.preferences.config[key] = val;
            break;

        case 'filename_extension':
            if (!this.requireValidOption(key, val, ['txt', 'md', 'markdown'])) {
                return false;
            }
            Action.preferences.config[key] = val;
            break;

        case 'model':
            if (!this.requireValidOption(key, val, ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-32k'])) {
                return false;
            }
            Action.preferences.config[key] = val;
            break;

        case 'temperature':
            if (!this.requireValidOption(key, val, ['0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '2.0'])) {
                return false;
            }
            Action.preferences.config[key] = parseFloat(val);
            break;

        // Integer options.
        case 'max_response_tokens':
            if (val.toLowerCase() === 'infinity') {
                Action.preferences.config[key] = Infinity;
                break;
            }
        // eslint-disable-next-line no-fallthrough
        case 'max_history_tokens':
        case 'max_history_minutes':
        case 'cache_expiration_minutes':
        case 'cache_min_words':
        case 'history_expiration_days':
        case 'timeout':
            if (!this.requireInt(key, val)) {
                return false;
            }
            Action.preferences.config[key] = parseFloat(val);
            break;

        default:
            LaunchBar.alert(`“${key}” is not a valid configuration option. To view all configuration options use the “config” command.`);
            return false;
        }

        LaunchBar.displayNotification({
            title: 'ChipiChat configuration saved',
            string: `“${key}” has been set to “${val}”`
        });
    }

    get(key) {
        return typeof Action.preferences.config[key] !== 'undefined' ? Action.preferences.config[key] : '';
    }

    show() {
        return Object.entries(Action.preferences.config).sort().map(([key, val]) => {
            if (key === 'api_key') {
                val = `${val.substring(0, 7)}…`;
            }
            return `${key}: ${val}\n`;
        }).join('\n');
    }
}
