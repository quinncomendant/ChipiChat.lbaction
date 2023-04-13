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

class Util {
    countTokens(str) {
        // One token generally corresponds to ~4 characters of text for common English text. https://platform.openai.com/tokenizer
        return str.length / 4;
    }

    characterLengthFromTokens(token_count) {
        // One token generally corresponds to ~4 characters of text for common English text. https://platform.openai.com/tokenizer
        return token_count * 4;
    }

    unprefix(str) {
        const words = str.replace(/\s+/g, ' ').trim().split(' ');
        words.shift();
        return words.join(' ');
    }

    truncate(str, max_length) {
        return str.length <= max_length ? str : str.substr(0, str.lastIndexOf(' ', max_length)).replace(/[,.!? ]*$/, '').trim() + '…';
    }

    fnv1aHash(str) {
        str = str.trim();
        const FNV_PRIME = 0x01000193;
        const FNV_OFFSET = 0x811c9dc5;
        let hash = FNV_OFFSET;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash *= FNV_PRIME;
        }
        return hash >>> 0;
    }

    slug(str) {
        return str
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    dirname(path) {
        return path.substring(0, path.lastIndexOf('/') + 1);
    }

    safeFilename(str) {
        const hash = this.fnv1aHash(str).toString();
        const slug = this.slug(str).substring(0, 250 - hash.length);
        return `${slug}-${hash}`;
    }

    filenameFromInputString(str) {
        return `${Action.cachePath}/${this.safeFilename(str)}.${config.get('filename_extension')}`;
    }

    saveFile(output_filename, content) {
        if (!File.createDirectory(this.dirname(output_filename)) || !File.isWritable(this.dirname(output_filename))) {
            LaunchBar.alert(`Unable to write to directory: ${this.dirname(output_filename)}`);
            return false;
        }

        try {
            File.writeText(content, output_filename);
            LaunchBar.debugLog(`Created file: ${output_filename}`);
        } catch (e) {
            LaunchBar.alert(`Failed to write to file: ${output_filename} (${e})`);
            return false;
        }
        return true;
    }

    openFile(filename) {
        // LaunchBar does not hide after using LaunchBar.openURL(), so use the `open` command instead.
        LaunchBar.execute('/usr/bin/open', '-t', filename);
    }

    versionCheck() {
        var result = HTTP.getJSON('https://api.github.com/repos/quinncomendant/ChipiChat.lbaction/releases/latest');
        if (typeof result.data !== 'undefined') {
            if (Action.version === result.data.tag_name) {
                LaunchBar.alert(`ChipiChat is up-to-date`, `You have version ${Action.version} which is the latest version available.`);
                return;
            } else if (Action.version > result.data.tag_name) {
                const up_to_date_response = LaunchBar.alert(`ChipiChat is up-to-date`, `You have version ${Action.version} which is newer than the latest version available.`, 'Close', 'Download old version');
                switch (up_to_date_response) {
                case 1:
                    LaunchBar.openURL('https://github.com/quinncomendant/ChipiChat.lbaction/releases')
                    break;
                }
                return;
            } else if (result.data.tag_name > Action.version) {
                const new_version_response = LaunchBar.alert(`ChipiChat has a new version available`, `${result.data.tag_name} is the latest version available. You have version ${Action.version}.`, 'Close', 'Download new version');
                switch (new_version_response) {
                case 1:
                    LaunchBar.openURL('https://github.com/quinncomendant/ChipiChat.lbaction/releases')
                    break;
                }
                return;
            }
        }
        LaunchBar.alert(`ChipiChat version ${Action.version}`, `Failed to check if a new version is available. ${typeof result.error !== 'undefined' ? result.error : ''}`);
    }

    actionOutputChildren(assistant_message) {
        let output = [];
        let in_code_block = false;
        // Make one line out of bulleted lines that break to the next line.
        assistant_message.replace(/^(- \w[^\n\r]+)[\n\r]  /gm, '$1 ').split('\n').forEach(line => {
            if (/^ *```/.test(line)) {
                in_code_block = !in_code_block;
                return;
            }
            if (in_code_block) {
                output.push({ title: line, icon: 'font-awesome:fa-bug'});
                return;
            }
            if (/^ *- /.test(line)) {
                output.push({ title: line.replace(/^- /, ''), icon: 'font-awesome:fa-caret-right'});
                return;
            }
            if (/^ *\d{1,2}\. /.test(line)) {
                output.push({ title: line, icon: 'font-awesome:fa-genderless'});
                return;
            }
            output.push({ title: line, icon: 'font-awesome:fa-comment'});
        });
        return output;
    }

    actionOutput(assistant_message, output_filename) {
        return {
            title: assistant_message,
            children: this.actionOutputChildren(assistant_message),
            action: 'defaultAction',
            actionArgument: output_filename,
            quickLookURL: File.fileURLForPath(output_filename),
            icon: 'ChipiChat-bw.png'
        };
    }
}