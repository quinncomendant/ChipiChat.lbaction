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
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    safeFilename(str) {
        const hash = this.fnv1aHash(str).toString();
        const slug = this.slug(str).substring(0, 250 - hash.length);
        return `${slug}-${hash}`;
    }

    dirname(path) {
        return path.substring(0, path.lastIndexOf('/') + 1);
    }

    saveFile(output_filename, content) {
        if (!File.createDirectory(this.dirname(output_filename)) || !File.isWritable(this.dirname(output_filename))) {
            LaunchBar.alert(`Unable to write to directory: ${this.dirname(output_filename)}`);
            return;
        }

        try {
            File.writeText(content, output_filename);
            LaunchBar.debugLog(`Created file: ${output_filename}`);
        } catch (e) {
            LaunchBar.alert(`Failed to write to file: ${output_filename} (${e})`);
        }
    }
}