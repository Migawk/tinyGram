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
 */
export default class TelegramBot extends EventEmitter {
  token: string;
  bot: {
    id: string;
    is_bot: boolean;
    username: string;
    can_join_groups: boolean;
  };
  private lastUpdateCheck: number = 0;

  /**
   * @param settings Must contain at least token. Optional: frequency(how often getting updates from the server), isStream - true by default. If you just want create object and dont send request to `getUpdates`, just toggle it to `false`.
   */
  constructor({ token, frequency, isStream = true }: IBotConfig) {
    super();
    this.token = token;

    if (isStream)
      setInterval(async () => {
        const result = await this.getUpdate(true);
        if (!result) return;

        if (result.type === "message") {
          const msg = result.message;

          if (
            msg.message.entities &&
            msg.message.entities.findIndex(
              (ent) => ent.type === "bot_command"
            ) !== -1
          ) {
            const lMsg = msg.message.text.split(" ");
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
      }, frequency ?? 5000);

    async function update() {
      const res = await this.getMe();
      if (res.err) {
        console.log("Err during the stating");
        return setTimeout(update, 5000);
      }

      this.bot = res.data;
      this.emit("ready", res.data);
    }

    update.call(this);
  }

  /**
   * Get information about the bot. Shoots at least once for `ready`-emmit.
   */
  getMe() {
    return this.request("getMe");
  }
  /**
   *
   * @param offset send with offset?(Just makes one more request that removes the last message from the telegram server)
   */
  async getUpdate(offset: boolean = false): Promise<TelegramUpdate | null> {
    const response = (await this.request("getUpdates")) as {
      data: TelegramGetUpdatesResponse;
      err: boolean;
    };

    if (response.err) return;

    if (offset && response.data.length > 0)
      this.request("getUpdates", {
        offset: response.data[0].update_id + 1,
      });

    const lastUpdate = response.data[0];
    if (!lastUpdate || lastUpdate.update_id === this.lastUpdateCheck)
      return null;

    this.lastUpdateCheck = lastUpdate.update_id;

    if ("message" in lastUpdate) {
      return {
        type: "message",
        message: this.messageFabric(lastUpdate.message),
      };
    } else if ("callback_query" in lastUpdate) {
      const { callback_query } = lastUpdate;
      callback_query.from = this.authorFabric(
        callback_query.from,
        callback_query.message
      );
      callback_query.message = this.messageFabric(
        callback_query.message
      ).message;

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

    const res = (await this.request("sendMessage", body)) as {
      data: TelegramMessage;
      err: boolean;
    };
    if (!res.err) return res.data as TelegramMessage; // TODO: prepare msg using msgFabric;
    console.log(res);

    return null;
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

    let res: { data: TelegramMessage; err: boolean };
    if (photo instanceof Buffer) {
      res = await this.requestPost("sendPhoto", {
        ...body,
        photo: new Blob([body.photo]),
      });
    } else {
      res = await this.request("sendPhoto", body);
    }

    if (!res.err) return res.data;

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

    let res: { data: TelegramMessage; err: boolean };
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

    if (!res.err) return res.data;

    return null;
  }
  async sendSticker(chatId: number | string, sticker: string | InputSticker) {
    const res = (await this.request("sendSticker", {
      chat_id: chatId,
      sticker,
    })) as { data: TelegramMessage; err: boolean };

    if (!res.err) return res.data;

    return null;
  }
  /**
   * Just request file. Usually is used in couple with `downloadFile`.
   * @param file_id string
   */
  async getFile(file_id: string) {
    const res = (await this.request("getFile", { file_id })) as {
      data: TelegramFile;
      err: boolean;
    };

    if (!res.err) return res.data;

    return null;
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

    const res = (await this.request("editMessageText", body)) as {
      data: TelegramMessage;
      err: boolean;
    };
    if (!res.err) return res.data;

    console.log(res);

    return null;
  }
  async editMessageCaption(
    caption: string,
    messageId?: number,
    chatId?: number
  ) {
    const res = (await this.request("editMessageCaption", {
      caption,
      message_id: messageId,
      chat_id: chatId,
    })) as { data: TelegramMessage; err: boolean };

    if (!res.err) return res.data;

    return null;
  }
  async editMessageReplyMarkup(
    messageId?: number,
    chatId?: number,
    replyMarkup?: ReplyMarkup
  ) {
    const res = (await this.request("editMessageReplyMarkup", {
      message_id: messageId,
      chat_id: chatId,
      reply_markup: replyMarkup,
    })) as { data: TelegramMessage; err: boolean };
    if (!res.err) return res.data;
  }
  async deleteMessage(chatId: number, messageId: number) {
    const res = (await this.request("deleteMessage", {
      chat_id: chatId,
      message_id: messageId,
    })) as { data: boolean; err: boolean };

    if (!res.err) return res.data;
    return null;
  }
  async getStickerSet(name: string) {
    const res = (await this.request("getStickerSet", { name })) as {
      data: TelegramStickerSet;
      err: boolean;
    };
    if (!res.err) return res.data;

    return null;
  }
  async createNewStickerSet({
    userId,
    name,
    title,
    stickers,
    sticker_type = "regular",
  }: ICreateNewStickerSet) {
    const res = (await this.requestPost("createNewStickerSet", {
      user_id: userId.toString(),
      name,
      title,
      stickers: stickers.toString(),
      sticker_type,
    })) as { data: boolean; err: false } | { data: TelegramError; err: true };

    return res;
  }
  async uploadStickerFile(
    userId: string,
    sticker: Blob,
    sticker_format: "static" | "animated" | "video" = "static"
  ) {
    const res = (await this.requestPost(
      "uploadStickerFile",
      {
        user_id: userId,
        sticker,
        sticker_format,
      },
      {
        method: "POST",
        headers: {
          "Content-Type": "form/date",
        },
      }
    )) as { data: { result: TelegramFile }; err: boolean };
    if (!res.err) return res.data.result;

    return null;
  }
  async addStickerToSet(userId: string, name: string, sticker: string) {
    const res = (await this.request("addStickerToSet", {
      user_id: userId,
      name,
      sticker,
    })) as { data: boolean; err: boolean };
    if (!res.err) return res.data;

    console.log(res);

    return null;
  }
  async deleteStickerFromSet(fileId: string) {
    const res = (await this.request("deleteStickerFromSet", {
      sticker: fileId,
    })) as { data: boolean; err: boolean };
    if (!res.err) return res.data;

    return null;
  }
  async replaceStickerInSet(
    userId: string,
    name: string,
    oldFileId: string,
    sticker: InputSticker
  ) {
    const res = (await this.request("replaceStickerInSet", {
      user_id: userId,
      name,
      old_sticker: oldFileId,
      sticker: JSON.stringify(sticker),
    })) as { data: boolean; err: boolean };
    if (!res.err) return res.data;

    console.log(res);

    return null;
  }
  async deleteStickerSet(name: string) {
    const res = (await this.request("deleteStickerSet", {
      name,
    })) as { data: boolean; err: boolean };
    if (!res.err) return res.data;

    return null;
  }
  async setStickerSetTitle(name: string, title: string) {
    const res = (await this.request("setStickerSetTitle", {
      name,
      title,
    })) as { data: boolean; err: boolean };

    if (!res.err) return res.data;
    return null;
  }
  private async request(
    method: methods,
    params?: { [key: string]: any }
  ): Promise<{ data: any; err: boolean }> | undefined {
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
      if (res && res.data.ok) return { data: res.data.result, err: false };
      return { ...res, err: true };
    } catch (e) {
      if (e.status < 200 || e.status > 299) {
        if (e.status === 409) return { err: true, ...e };
        // console.error({ err: true, ...e });
        return { err: true, ...e };
      }
      return { err: true, ...e };
    }
  }
  private async requestPost(
    method: methodsPost,
    body: { [key: string]: any },
    config: AxiosRequestConfig = {}
  ) {
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
      const res = (await axios.postForm(link, form)) as TelegramResponse & {
        err: boolean;
      };
      if (!res.err && res.data.ok) return res;
      return { ...res, err: true };
    } catch (e) {
      if (e.status < 200 || e.status > 299) {
        if (e.status === 409) return null;
      }
      return { err: true, data: e.response.data };
    }
  }
  private authorFabric(user: User, message: TelegramMessage): BotUser & User {
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
  private messageFabric(message: TelegramMessage): BotMessage {
    const rawMsg: Partial<BotMessage> = {
      message: {
        ...message,
        text: message.text,
      } as BotTelegramMessage,
      reply: (text: string, rest: { [key: string]: string } = {}) => {
        this.sendMessage(message.from.id, text, rest);
        return this.messageFabric(message);
      },
    };

    rawMsg.message.from = this.authorFabric(
      rawMsg.message.from as User,
      rawMsg.message
    );
    rawMsg.message.edit = async (
      text: string,
      options: TelegramSendMessage
    ) => {
      await this.editMessageText(
        text,
        rawMsg.message.message_id,
        rawMsg.message.chat.id,
        options
      );
    };
    rawMsg.message.delete = async () =>
      this.deleteMessage(rawMsg.message.chat.id, rawMsg.message.message_id)
        ? true
        : false;
    if (rawMsg.message.chat.type) {
      rawMsg.message.chat = this.authorFabric(
        rawMsg.message.chat as any,
        rawMsg.message
      ) as any;
    }

    return rawMsg as BotMessage;
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
