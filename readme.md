# MigGram v0.0.2
Ulta tiny library for vital interaction with Telegram API. This library is pretty good for very simple bots or for beginners.
Works fine either with JavaScript or TypeScript.

## Example
```js
import TelegramBot from "miggram";

// Init
const tg = new TelegramBot({
  token: env.token,
});

// Get information about the bot when everything is ok
tg.on("ready", (res) => {
	console.log(res.username);
});

// Recieve the message and reply it with a favorite effect.
tg.on("update", (msg) => {
  msg.reply("Hi", {
    message_effect_id: "surprise",
  });
});
```

## InlineKeybaord generator
```js
// Goes from the same path, but not default
import {InlineKeyboardGenerator} from "miggram";
const rm = new InlineKeyboardGenerator()
  .addBtn("Touch me", "callback_event") // add new button.
  .newRow() // create new row and turn next buttons into.
  .rm() // get fully prepared rest content for the message.

// And proceed by adding *rm* to the rest.
bot.sendMessage(msg.from.id, "Let interactive", rm);
// By the way, rm isn't sealed, so you can roughly add there more payload like message_effect_id.
```

## Docs
[Read docs](./docs.md)

## Additional info
* TelegramBot class is only implementation of EventEmitter.
* `update` ignores commads.
* you can listen to `update`, `callback`, `ready` and `command`.
* Most of types is described  and you can follow them.

[Official Telegram API docs](https://core.telegram.org/bots/api#inputsticker)


## Last edits
### 0.0.3
Added payment: `sendInvoice`, `answerPreCheckoutQuery`.
Added event for handling payment: `checkout`