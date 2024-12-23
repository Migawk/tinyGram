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

## Additional info
* TelegramBot class is only implementation of EventEmitter.
* `update` ignores commads.
* you can listen to `update`, `callback`, `ready` and `command`.
* Most of types is described  and you can follow them.

[Official Telegram API docs](https://core.telegram.org/bots/api#inputsticker)