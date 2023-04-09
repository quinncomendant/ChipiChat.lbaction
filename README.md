# ChipiChat: LaunchBar🥂ChatGPT

Interact with [ChatGPT](https://chat.openai.com/chat) and receive responses directly in [LaunchBar](https://www.obdev.at/products/launchbar/index.html "LaunchBar 6"). Conversation history is preserved for context. Responses are cached on disk.

![Demo](https://send.strangecode.com/f/chipichat-demo-20230404.gif)


## Usage

### Send a message, question, or instruction to Chat GPT and quickly obtain and manipulate responses, LaunchBar-style:

- `⌘` *(command, held when running the action)* Automatically open the response in your text editor.
- `⇧` *(shift, held when running the action)* Automatically insert the response at the current cursor position.
- `⌃` *(control, held when running the action)* Automatically Quick Look the response.
-  `⌘C` Copy the response to the clipboard.
-  `⌘Y` Quick Look the response.
-  `↵` *(return)* Open the response in your text editor (reconfigurable using the `default_action` config [option](#options)).
-  `→` *(right-arrow)* Browse the response as a list (ideal for acting on specific lines of text).
-  `⇥` *(tab)* Send the text to other LaunchBar targets, e.g., send the output to a friend by passing it to the Compose Message action.

### Prefix your message with one-or-more modifiers for enhanced functionality:

-  `N.N`: Set temperature to adjust response randomness, e.g., “1.5 why is the sky blue?”.
-  `4`: Use the GPT-4 model (requires GPT-4 API access).
-  `code`: Use the coder persona for code-only responses.
-  `copy`: Automatically copy the response to the clipboard.
-  `list`: Request response formatted as a bulleted list.
-  `new`: Start a new conversation with no history.
-  `write`: Use the copywriter persona, adhering to Orwell’s six rules for writers.

You can combine modifiers, e.g., “`code copy 4 js function to get a uuid`” sends “`js function to get a uuid`” to *GPT-4* API with the *code persona* and *copies the response*. All modifiers must go at the beginning of the message.

### Manage history and settings with special commands:

- `clear`: Remove chat history without sending a message.
- `config`: Show current configuration settings.
- `configreset`: Reset all configuration options to defaults.
- `configset KEY VALUE`: Set the configuration KEY to VALUE.
- `export`: Save conversation history to a file in ~/Downloads/.
- `help`: Display this help message.
- `history`: Display recent chat history.
- `version`: Display ChipiChat version and check if a new version is available.

## Installation

### Get an OpenAI API key

Before you can use ChatGPT, you must get an OpenAI API key:

1. Create an [OpenAI account](https://platform.openai.com/signup).
2. Add a credit card in [Account → Billing → Payment methods](https://platform.openai.com/account/billing/payment-methods).
3. [Create a new secret API key](https://platform.openai.com/account/api-keys).

### Install ChipiChat

1. Download `ChipiChat.lbaction.zip` from [releases](https://github.com/quinncomendant/ChipiChat.lbaction/releases), unzip it, and copy the `ChipiChat.lbaction` file into `~/Library/Application Support/LaunchBar/Actions/`.
2. Open LaunchBar and type `cc` to invoke ChipiChat. 
3. Hit the spacebar, type `configset api_key YOURAPIKEYHERE`, and hit enter to save your API key in LaunchBar:

![configset api_key yourkeyhere](docs/1-set-api-key.png)

Now you’re ready to use ChipiChat!

### Usage example

Invoke ChipiChat again (type `cc`), hit the spacebar, then enter a message and hit enter:

![Example Message](docs/2-example-message.png)

After a couple seconds, you receive the response:

![Response](docs/3-response.png)

That’s a bit hard to read, but if you press the right-arrow key, you can view it as a list:

![Response As List](docs/4-response-as-list.png)

Or, you can view it in Quick Look (press the left-arrow key to go back, then press `⌘Y`):

![Response As Quick Look](docs/5-response-as-quicklook.png)

## Configuration

The following options can be changed using the `configset KEY VALUE` command. For example, to change the `system_message`:

```
configset system_message You are a helpful but sarcastic assistent.
````

To view currently-set values, send the `config` command.

To reset all configuration options to defaults, send the `configreset` command.

### Options

- `api_key`: Your OpenAI API key (default: empty).
- `cache_expiration_minutes`: How long before cached responses expire. This is useful to avoid loading a cached response for the same question in a different context, e.g., “show me how to do that” from the cache might contain an out-of-context response (default: `5`).
- `cache_min_words`: Minimum words in input text required before response is cached. Short phrases are less unique, and are more likely to load cached respones from a different context (default: `3`).
- `default_action`: The action to run when hitting enter *after* receiving a response. (options: `open`, `insert`, `quicklook`, `largetype`; default: `open`).
- `filename_extension`: The extension of cached files changes how they open in a text editor and Quick Look (default: `txt`). If you have a Quick Look extension that supports Markdown (e.g., [Peek](https://apps.apple.com/us/app/peek-a-quick-look-extension/id1554235898?mt=12)), change this to `md` for syntax highlighting. 😎
- `max_history_minutes`: Maximum age of conversation history in requests (default: `480`).
- `max_history_tokens`: Maximum amount of conversation history in requests (default: `1000`).
- `max_response_tokens`: Maximum amount of [tokens](https://platform.openai.com/docs/api-reference/chat/create#chat/create-max_tokens) to return in the response (default: `2000`).
- `max_user_message_tokens`: Maximum amount of tokens allowed in the input text (default: `1000`).
- `model`: Which OpenAI [model](https://platform.openai.com/docs/models/overview) to use (default: `gpt-3.5-turbo`).
- `system_message`: The [system message](https://platform.openai.com/docs/guides/chat/introduction) sets the overall behavior of the assistant (default: `You are a helpful assistant to an expert audience. Be succinct. Limit prose. Never repeat the user message. Never apologize. Never say “As an AI language model”.`).
- `temperature`: What sampling [temperature](https://platform.openai.com/docs/api-reference/completions/create#completions/create-temperature) to use, between `0.0` and `2.0` (default: `0.1`).
- `timeout`: How many seconds to wait for a response from the API (default: `20`; using GPT-4 adds timeout + 60 seconds).
- `user_message_addendum`: Supplemental instructions that are included with every user message, useful because `gpt-3.5-turbo` does not always pay attention to system messages (default: `Be succinct. Limit prose. Never repeat the user message.`).

## To do

- [ ] Persona management:
    - `persona NAME SYSTEM-MESSAGE` to create or update a persona.
    - `persona NAME` to set a persona as the default.
    - `NAME USER-MESSAGE` to send USER-MESSAGE to the API using the system message persona assigned to NAME.
    - `persona NAME SYSTEM-MESSAGE` to create or update a persona.
    - For example, create a persona name `fix` that will be used to improve submitted text: `persona fix Rewrite the following text so that it is well reasoned and emotionally intelligent.` To use this persona, just send `fix Here is my text that needs to be fixed`.


## Support

Contact me [on Twitter](https://twitter.com/com) or create a [GitHub issue](https://github.com/quinncomendant/ChipiChat.lbaction/issues).

Do you find this free software useful? [Say thanks with a coffee!](https://ko-fi.com/strangecode)

----

[![ChipiChat icon](docs/ChipiChat.jpg)](docs/ChipiChat.jpg)