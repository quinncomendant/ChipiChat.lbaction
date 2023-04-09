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
    unprefix(str) {
        return str.slice(str.indexOf(' ') + 1);
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
        return `${Action.cachePath}/${this.safeFilename(str)}.md`;
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
        LaunchBar.hide();
    }

    versionCheck() {
        var result = HTTP.getJSON('https://api.github.com/repos/quinncomendant/ChipiChat.lbaction/releases/latest');
        if (typeof result.data !== 'undefined') {
            if (version === result.data.tag_name) {
                LaunchBar.alert(`ChipiChat is up-to-date`, `You have version ${version} which is the latest version available.`);
                return;
            } else if (version > result.data.tag_name) {
                const response = LaunchBar.alert(`ChipiChat is up-to-date`, `You have version ${version} which is newer than the latest version available.`, 'Close', 'Download old version');
                switch (response) {
                case 1:
                    LaunchBar.openURL('https://github.com/quinncomendant/ChipiChat.lbaction/releases')
                    break;
                }
                return;
            } else if (result.data.tag_name > version) {
                const response = LaunchBar.alert(`ChipiChat has a new version available`, `${result.data.tag_name} is the latest version available. You have version ${version}.`, 'Close', 'Download new version');
                switch (response) {
                case 1:
                    LaunchBar.openURL('https://github.com/quinncomendant/ChipiChat.lbaction/releases')
                    break;
                }
                return;
            }
        }
        LaunchBar.alert(`ChipiChat version ${version}`, `Failed to check if a new version is available. ${typeof result.error !== 'undefined' ? result.error : ''}`);
    }

    actionOutputChildren(response_text) {
        let output = [];
        let in_code_block = false;
        response_text.split('\n').forEach(line => {
            if (/^ *```/.test(line)) {
                in_code_block = !in_code_block;
                return;
            }
            if (in_code_block) {
                output.push({ title: line, icon: 'character:􀡅'});
                return;
            }
            if (/^ *- /.test(line)) {
                output.push({ title: line.replace(/^- /, ''), icon: 'character:🞄'});
                return;
            }
            if (/^ *\d{1,2}\. /.test(line)) {
                // Or…? 􀃊􀃌􀃎􀃐􀃒􀃔􀃖􀃘􀃚􀃈
                let match = line.match(/^ *(\d{1,2})\. /);
                if (!match) {
                    return;
                }
                switch (match[1]) {
                    case '0': output.push({ title: line, icon: 'character:􀀸'}); return;
                    case '1': output.push({ title: line, icon: 'character:􀀺'}); return;
                    case '2': output.push({ title: line, icon: 'character:􀀼'}); return;
                    case '3': output.push({ title: line, icon: 'character:􀀾'}); return;
                    case '4': output.push({ title: line, icon: 'character:􀁀'}); return;
                    case '5': output.push({ title: line, icon: 'character:􀁂'}); return;
                    case '6': output.push({ title: line, icon: 'character:􀁄'}); return;
                    case '7': output.push({ title: line, icon: 'character:􀁆'}); return;
                    case '8': output.push({ title: line, icon: 'character:􀁈'}); return;
                    case '9': output.push({ title: line, icon: 'character:􀁊'}); return;
                    default: output.push({ title: line, icon: 'character:􀍡'});  return;
                }
            }
            output.push({ title: line, icon: 'character:􀌪'});
        });
        return output;
    }

    actionOutput(response_text, output_filename) {
        return {
            title: response_text,
            children: this.actionOutputChildren(response_text),
            action: 'defaultAction',
            actionArgument: output_filename,
            quickLookURL: File.fileURLForPath(output_filename),
            icon: 'ChipiChat-bw.png'
        };
    }
}