import axios, { AxiosRequestConfig } from "axios";
import EventEmitter from "eventemitter3";
import { createWriteStream } from "fs";

interface IBotConfig {
  token: string;
  frequency?: number;
  isStream?: boolean;
}

/**
 * ## TelegramBot
 * The class used for interaction with telegram API.
 *
 * ### It's an implementation of Event Emitter and has 3 events:
 * * ready - shoots when bots been started
 * * message - shoots when message is been recieved
 * * callback - shoots when callback is benn executed
 * @property token
 * @property bot contains info abot the bot, thats been recieved from `getMe`.
 */
export default class TelegramBot extends EventEmitter {
  private token: string;
  private isStream: boolean;
  private lastUpdateCheck: number = 0;

  frequency: number;
  initFrequency: number;

  bot: {
    id: string;
    is_bot: boolean;
    username: string;
    can_join_groups: boolean;
  };

  /**
   * @param settings Must contain at least token. Optional: frequency(how often getting updates from the server), isStream - true by default. If you just want create object and dont send request to `getUpdates`, just toggle it to `false`.
   */
  constructor({ token, frequency, isStream = true }: IBotConfig) {
    super();
    this.token = token;
    this.isStream = isStream;
    this.frequency = frequency;
    this.initFrequency = frequency;

    if (isStream) this.check();

    async function update() {
      const res = await this.getMe();
      if (res.err) {
        console.log("Err during the stating");
        return setTimeout(update, 5000);
      }

      this.bot = res.result;
      this.emit("ready", res.result);
    }

    update.call(this);
  }
  async check() {
    const result = await this.getUpdate(true);
    if (result) {
      if (result.type === "message") {
        const msg = this.messageFabric(result);

        if (
          msg.entities &&
          msg.entities.findIndex((ent) => ent.type === "bot_command") !== -1
        ) {
          const lMsg = msg.text.split(" ");
          const extension = { cmd: lMsg[0].slice(1), args: lMsg.slice(1) };
          this.emit("command", { ...msg, ...extension });
        } else {
          this.emit("update", msg);
        }
      } else if (result.type === "callback_query") {
        let args: string[] = [];

        if (result.callback_query.data.indexOf("_") !== -1) {
          args = result.callback_query.data.split("_");

          args.shift();
        }

        this.emit("callback", { ...result.callback_query, args });
      }
    }

    if (this.isStream)
      setTimeout(() => this.check.call(this), this.frequency ?? 5000);
  }

  /**
   * Get information about the bot. Shoots at least once for `ready`-emmit.
   */
  async getMe() {
    return this.request("getMe");
  }
  /**
   *
   * @param offset send with offset?(Just makes one more request that removes the last message from the telegram server)
   */
  async getUpdate(offset: boolean = false) {
    const response = await this.request<TelegramGetUpdatesResponse>(
      "getUpdates"
    );

    if (!response || !response.ok) return;

    if (offset && response.result.length > 0)
      this.request("getUpdates", {
        offset: response.result[0].update_id + 1,
      });

    const lastUpdate = response.result[0];
    if (!lastUpdate || lastUpdate.update_id === this.lastUpdateCheck)
      return null;

    this.lastUpdateCheck = lastUpdate.update_id;

    if ("message" in lastUpdate) {
      const res = {
        type: "message",
        ...(this.messageFabric(lastUpdate.message) as {
          message: BotTelegramMessage;
          reply: () => {};
        } & any),
      };
      return res;
    } else if ("callback_query" in lastUpdate) {
      const { callback_query } = lastUpdate;
      callback_query.from = this.authorFabric(callback_query.from);
      callback_query.message = this.messageFabric(callback_query.message);

      return { type: "callback_query", callback_query };
    }
  }
  /**
   * Send message.
   * @param chat_id can be either number or string. chat_id can be user_id for sending private messages. Also is can be as @mention of the user
   * @param text Optional, just string. But if you want to send a picture and the text, use `caption` in the next param
   * @param rest Optional, contains all that could be used for the request.
   * @returns
   */
  async sendMessage(
    chat_id: number | string,
    text: string,
    rest?: Partial<TelegramSendMessage>
  ) {
    const body = {
      chat_id,
      text,
      ...rest,
    };
    const msgEffectId = {
      fire: "5104841245755180586", //'🔥'
      like: "5107584321108051014", //'👍'
      dislike: "5104858069142078462", //'👎'
      heart: "5044134455711629726", //'❤️'
      surprise: "5046509860389126442", //'🎉'
      poop: "5046589136895476101", //'💩'
    };
    if (body.message_effect_id)
      body.message_effect_id = msgEffectId[body.message_effect_id] as any;

    return this.request<TelegramMessage>("sendMessage", body);
  }
  async sendPhoto(
    chatId: number | string,
    photo: string | Buffer,
    caption?: string,
    rest?: Partial<TelegramSendPhoto>
  ) {
    const chat_id = chatId.toString();
    const body: any = {
      chat_id,
      photo,
      caption,
      ...rest,
    };

    let res: TelegramResponse<TelegramMessage>;
    if (photo instanceof Buffer) {
      res = await this.requestPost<TelegramMessage>("sendPhoto", {
        ...body,
        photo: new Blob([body.photo]),
      });
    } else {
      res = await this.request<TelegramMessage>("sendPhoto", body);
    }

    return res;
  }
  async sendDocument(
    chatId: number | string,
    document: string | Buffer,
    caption?: string,
    rest?: any,
    fileName?: string
  ) {
    const chat_id = chatId.toString();
    const body = {
      chat_id,
      document,
      ...rest,
    };
    if (caption) body.caption = caption;

    let res: Awaited<TelegramResponse<TelegramMessage>>;
    if (document instanceof Buffer) {
      res = await this.requestPost("sendDocument", {
        ...body,
        document: fileName
          ? [new Blob([body.document]), fileName]
          : new Blob([body.document]),
      });
    } else {
      res = await this.request("sendDocument", body);
    }

    return res;
  }
  async sendSticker(chatId: number | string, sticker: string | InputSticker) {
    return this.request<TelegramMessage>("sendSticker", {
      chat_id: chatId,
      sticker,
    });
  }
  /**
   * Just request file. Usually is used in couple with `downloadFile`.
   * @param file_id string
   */
  async getFile(file_id: string) {
    return this.request<TelegramFile>("getFile", { file_id });
  }
  async downloadFile(path: string, fileOut: string) {
    const res = await axios.get(
      `https://api.telegram.org/file/bot${this.token}/${path}`,
      {
        responseType: "stream",
      }
    );

    const writer = createWriteStream(fileOut);
    return new Promise((resolve, reject) => {
      res.data.pipe(writer);
      let error = null;

      writer.on("error", (err) => {
        error = err;
        writer.close();
        reject(err);
      });

      writer.on("close", () => {
        if (!error) {
          resolve(true);
        }
      });
    });
  }
  async editMessageText(
    text: string,
    messageId: number,
    chatId: number,
    options: TelegramSendMessage
  ) {
    const body: any = {
      text,
      message_id: messageId,
      chat_id: chatId,
      ...options,
    };

    return this.request<TelegramMessage>("editMessageText", body);
  }
  async editMessageCaption(
    caption: string,
    messageId?: number,
    chatId?: number
  ) {
    return this.request<TelegramMessage>("editMessageCaption", {
      caption,
      message_id: messageId,
      chat_id: chatId,
    });
  }
  async editMessageReplyMarkup(
    messageId?: number,
    chatId?: number,
    replyMarkup?: ReplyMarkup
  ) {
    return this.request("editMessageReplyMarkup", {
      message_id: messageId,
      chat_id: chatId,
      reply_markup: replyMarkup,
    });
  }
  async deleteMessage(chatId: number, messageId: number) {
    return this.request<boolean>("deleteMessage", {
      chat_id: chatId,
      message_id: messageId,
    });
  }
  async getStickerSet(name: string) {
    return this.request<TelegramStickerSet>("getStickerSet", { name });
  }
  async createNewStickerSet({
    userId,
    name,
    title,
    stickers,
    sticker_type = "regular",
  }: ICreateNewStickerSet) {
    return this.requestPost<boolean>("createNewStickerSet", {
      user_id: userId.toString(),
      name,
      title,
      stickers: stickers.toString(),
      sticker_type,
    });
  }
  async uploadStickerFile(
    userId: string,
    sticker: Blob,
    sticker_format: "static" | "animated" | "video" = "static"
  ) {
    return this.requestPost<TelegramFile>("uploadStickerFile", {
      user_id: userId,
      sticker,
      sticker_format,
    });
  }
  /**
   *
   * @param userId
   * @param name
   * @param sticker Input_sticker parsed object
   * @returns
   */
  async addStickerToSet(userId: string, name: string, sticker: string) {
    const body = {
      user_id: userId,
      name,
      sticker,
    };

    return this.request<boolean>("addStickerToSet", body);
  }
  async deleteStickerFromSet(fileId: string) {
    return this.request<boolean>("deleteStickerFromSet", {
      sticker: fileId,
    });
  }
  async replaceStickerInSet(
    userId: string,
    name: string,
    oldFileId: string,
    sticker: InputSticker
  ) {
    return this.request<boolean>("replaceStickerInSet", {
      user_id: userId,
      name,
      old_sticker: oldFileId,
      sticker: JSON.stringify(sticker),
    });
  }
  async deleteStickerSet(name: string) {
    return this.request<boolean>("deleteStickerSet", {
      name,
    });
  }
  async setStickerSetTitle(name: string, title: string) {
    const res = await this.request("setStickerSetTitle", {
      name,
      title,
    });

    return res;
  }
  async getChat(id: number) {
    const res = await this.request<TelegramChatFullInfo>("getChat", {
      chat_id: id,
    });
    return res;
  }
  async request<T extends TelegramResponse<T> | any>(
    method: AvailableMethodsGet,
    params?: { [key: string]: any }
  ): Promise<TelegramResponse<T> | null> {
    let link = `https://api.telegram.org/bot${this.token}/${method}`;

    if (params) {
      let preparedParams: { [key: string]: string | number } =
        Object.fromEntries(
          Object.entries(params).map((r) => {
            if (r[0] === "reply_markup") return [r[0], JSON.stringify(r[1])];
            return r;
          })
        );

      let parsedParams = objectToParams(preparedParams);
      link += "?" + parsedParams;
    }

    try {
      const res = await axios.get(link);

      return res.data;
    } catch (e) {
      return e.response.data;
    }
  }
  private async requestPost<T extends TelegramResponse<T> | any>(
    method: AvalableMethodsPost,
    body: { [key: string]: any }
  ): Promise<TelegramResponse<T> | null> {
    const link = `https://api.telegram.org/bot${this.token}/${method}`;
    const form = new FormData();
    Object.entries(body).forEach(([n, e]) => {
      if (Array.isArray(e)) {
        form.append(n, e[0], e[1]);
      } else {
        form.append(n, e);
      }
    });

    try {
      const res: any = await axios.postForm(link, form);

      return res.data;
    } catch (e) {
      return e.response.data;
    }
  }
  private authorFabric(user: TelegramUser): BotUser & TelegramUser {
    return {
      ...user,
      reply: (text: string) => {
        return this.sendMessage(user.id, text, {
          // reply_to_message: message
          // reply_parameters: {
          //     message_id: message.message_id,
          //     chat_id: message.chat.id as number
          // }
        });
      },
      write: (text, rest) => {
        return this.sendMessage(user.id, text, rest);
      },
    };
  }
  messageFabric(message: TelegramMessage): TelegramMessageParsed {
    const rawMsg: Partial<TelegramMessageParsed> = {
      ...message,
      reply: (text: string, rest: { [key: string]: string } = {}) => {
        this.sendMessage(message.from.id, text, rest);
        return this.messageFabric(message);
      },
    };

    rawMsg.from = this.authorFabric(rawMsg.from as TelegramUser);
    rawMsg.edit = async (text: string, options: TelegramSendMessage) => {
      await this.editMessageText(
        text,
        rawMsg.message_id,
        rawMsg.chat.id,
        options
      );
    };
    rawMsg.delete = async () =>
      this.deleteMessage(rawMsg.chat.id, rawMsg.message_id) ? true : false;
    if (rawMsg.chat.type) {
      rawMsg.chat = this.authorFabric(rawMsg.chat as any) as any;
    }

    return rawMsg as TelegramMessageParsed;
  }
}

/**
 * Generates InlineKeyboard that used for Telegram.
 * **The keybord-object is in res property.**
 */
export class InlineKeyboardGenerator {
  res: TelegramButton[][] = [[]];
  private len: number = 0;

  /**
   * Make a new row.
   * @returns InlineKeyboardGenerator
   */
  newRow() {
    this.res.push([]);
    this.len++;
    return this;
  }
  /**
   * Add button to previos row. Max 7 buttons at the row.
   * @param text - The label of the button
   * @param callback_data - The callback of the button
   * @returns this
   */
  addBtn(text: string, callback_data: string) {
    if (this.res[this.len].length > 7) return this;
    this.res[this.len].push({ text, callback_data });
    return this;
  }

  rm(): { reply_markup: ReplyMarkup } {
    Object.assign(this, {
      reply_markup: {
        inline_keyboard: this.res,
      },
    });
    return {
      reply_markup: {
        inline_keyboard: this.res,
      },
    };
  }
}

function objectToParams(obj: { [key: string]: any }) {
  const params = new URLSearchParams();
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      params.append(key, obj[key]);
    }
  }
  return params.toString();
}
