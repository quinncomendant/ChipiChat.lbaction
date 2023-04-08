# ChipiChat: LaunchBar🥂ChatGPT

Interact with [ChatGPT](https://chat.openai.com/chat) and receive responses directly in [LaunchBar](https://www.obdev.at/products/launchbar/index.html "LaunchBar 6"). Conversation history is preserved for context. Responses are cached on disk.

![Demo](https://send.strangecode.com/f/chipichat-demo-20230404.gif)


## Usage

### Send a message, question, or instruction to Chat GPT and quickly obtain and manipulate responses, LaunchBar-style:

- `⌘` *(held when running the action)* Immediately open the response as a .md file in your text editor.
- `⇧` *(held when running the action)* Immediately insert the response at the current cursor position.
-  `⌘C` Copy the response to the clipboard.
-  `⌘Y` QuickLook the response.
-  `↵` *(return)* Open the response as a `.md` file in your text editor.
-  `→` *(right-arrow)* Browse the response as a list (ideal for copying only needed lines).
-  `⇥` *(tab)* Send the text to other LaunchBar targets.

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

Or, you can view it in QuickLook (press the left-arrow key to go back, then press `⌘Y`):

![Response As Quicklook](docs/5-response-as-quicklook.png)

## Configuration

The following options can be changed using the `configset KEY VALUE` command. For example, to change the `system_message`:

```
configset system_message You are a helpful but sarcastic assistent.
````

To view currently-set values, send the `config` command.

To reset all configuration options to defaults, send the `configreset` command.

### Options

- `api_key`: Your OpenAI API key (default: empty).
- `default_action`: The action to run when hitting enter after receiving a response. (options: `open`, `insert`, `quicklook`, `largetype`; default: `open`).
- `max_history_minutes`: Include up to *max_history_minutes* of conversation history in requests (default: `480`).
- `max_history_tokens`: Include up to *max_tokens* of conversation history in requests (default: `500`).
- `max_tokens`: The maximum number of [tokens](https://platform.openai.com/docs/api-reference/chat/create#chat/create-max_tokens) to generate (default: `1024`).
- `model`: Which OpenAI [model](https://platform.openai.com/docs/models/overview) to use (default: `gpt-3.5-turbo`).
- `system_message`: The [system message](https://platform.openai.com/docs/guides/chat/introduction) to send in requests (default: `You are a helpful assistant to an expert audience. Be succinct. Limit prose. Never repeat the user message. Never apologize. Never write “As an AI language model”.`).
- `temperature`: What sampling [temperature](https://platform.openai.com/docs/api-reference/completions/create#completions/create-temperature) to use, between `0.0` and `2.0` (default: `0.1`).
- `timeout`: How many seconds to wait for a response from the API (default: `15`; note: when using the much slower GPT-4, there is a hard-coded 120 second timeout).
- `user_message_addendum`: Supplemental instructions that are included with every user message (default: `Be succinct. Limit prose. Never repeat the user message.`).

## To do

- [ ] Persona management:
    - `persona NAME SYSTEM-MESSAGE` to create or update a persona.
    - `persona NAME` to set a persona as the default.
    - `NAME USER-MESSAGE` to send USER-MESSAGE to the API using the system message persona assigned to NAME.
    - `persona NAME SYSTEM-MESSAGE` to create or update a persona.
    - For example, create a persona name `fix` that will be used to improve submitted text: `persona fix Rewrite the following text so that it is well reasoned and emotionally intelligent.` To use this persona, just send `fix Here is my text that needs to be fixed`.
- [ ] Export conversation: `export` command saves all the user and assistent messages for the current session (since the last `clear`) to a `.md` file in ~/Downloads.
- [ ] Hold option to auto-open QuickLook after receiving a response.


## Support

Contact me [on Twitter](https://twitter.com/com) or file an [issue](https://github.com/quinncomendant/ChipiChat.lbaction/issues).

Do you find this free software useful? [Say thanks with a coffee!](https://ko-fi.com/strangecode)

----

[![ChipiChat icon](docs/ChipiChat.jpg)](docs/ChipiChat.jpg)