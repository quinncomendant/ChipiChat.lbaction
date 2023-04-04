# ChipiChat: LaunchBar 🥂 ChatGPT

Interact with [ChatGPT](https://chat.openai.com/chat) and receive responses directly in [LaunchBar](https://www.obdev.at/products/launchbar/index.html "LaunchBar 6"). Conversation history is preserved for context. Responses are cached on disk.

![Demo](docs/demo.gif)

(Just remember, ChatGPT makes mistakes – “LaunchBar for iOS”‽ 🙃)

## Usage

### Send a message, question, or instruction to Chat GPT and quickly obtain and manipulate responses, LaunchBar-style:

- `⌘` *(held when running the action)* Immediately open the response as a .md file in your text editor.
- `⇧` *(held when running the action)* Immediately paste the response at the current cursor position.
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
-  `new`: Start a new conversation with no history.
-  `write`: Use the copywriter persona, adhering to Orwell’s six rules for writers.

You can combine modifiers, e.g., “`code copy 4 js function to get a uuid`” sends “`js function to get a uuid`” to *GPT-4* API with the *code persona* and *copies the response*. All modifiers must go at the beginning of the message.

### Manage history and settings with special commands:

- `clear`: Remove chat history without sending a message.
- `config`: Show all configuration settings.
- `configset KEY VALUE`: Set the configuration KEY to VALUE.
- `help`: Display this help message.
- `history`: Display recent chat history.

## Installation

### Get an OpenAI API key

Before you can use ChatGPT, you must get an OpenAI API key:

1. Create an [OpenAI account](https://platform.openai.com/signup).
2. Add a credit card in [Account → Billing → Payment methods](https://platform.openai.com/account/billing/payment-methods).
3. [Create a new secret API key](https://platform.openai.com/account/api-keys).

### Install ChipiChat

1. Download a release and copy the `ChipiChat.lbaction` file into `~/Library/Application Support/LaunchBar/Actions/`.
2. Open LaunchBar and type `cc` to invoke ChipiChat. 
3. Hit the spacebar, enter `configset api_key YOURAPIKEYHERE`, and hit enter to save your API key in LaunchBar:

![configset api_key yourkeyhere](docs/1-set-api-key.png)

Now you’re ready to use ChipiChat!

### Usage example

Invoke ChipiChat again (type `cc`), hit the spacebar, then enter a message and hit enter:

![Example Message](docs/2-example-message.png)

After a couple seconds, you receive the response:

![Response](docs/3-response.png)

That’s a bit hard to read, but if you hit the right-arrow key, you can view it as a list:

![Response As List](docs/4-response-as-list.png)

Or, you can view it in QuickLook (press the left-arrow key to go back, then hit `⌘Y`):

![Response As Quicklook](docs/5-response-as-quicklook.png)

## Support

Contact me [on Twitter](https://twitter.com/com) or file an [issue](https://github.com/quinncomendant/ChipiChat.lbaction/issues).

Do you find this free software useful? [Say thanks with a coffee!](https://ko-fi.com/strangecode)
