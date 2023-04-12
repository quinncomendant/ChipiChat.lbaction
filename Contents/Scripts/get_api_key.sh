#!/usr/bin/env bash
# Detect the shell in use, load it, and return the OPENAI_API_KEY environment variable if found.
# Quinn Comendant <quinn@strangecode.com>
# 11 Apr 2023 16:28:32

function try_file() {
    local file=$1 key;
    key=$(test -f "$file" && $SHELL -c "source '$file'; echo \$OPENAI_API_KEY;");
    if test -n "$key"; then
        echo "$key";
        return 0;
    else
        return 1;
    fi
}

case $(basename "$SHELL") in
    zsh) try_file ~/.zshrc;;
    bash) try_file ~/.profile || try_file ~/.bash_profile || try_file ~/.bashrc;;
    fish) try_file ~/.config/fish/config.fish;;
esac