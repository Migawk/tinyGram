declare module "miggram" {
  /**
   * ## TelegramBot
   * The class used for interaction with telegram API.
   *
   * ### It's an implementation of Event Emitter and has 4 events:
   * * ready - shoots when bots been started
   * * update - shoots when message is been recieved. **Ignores commands**
   * * command - shoots when a command is been recieved
   * * callback - shoots when callback is been executed
   * @example
   * ```js
   * const mig = new TelegramBot({token});
   * mig.on("ready", (bot) => console.log(bot.username)) // prints the username of your bot.
   * ```
   */
  export default class TelegramBot {
    token: string;
    bot: {
      id: string;
      is_bot: boolean;
      username: string;
      can_join_groups: boolean;
    };
    constructor(init: {
      token: string;
      frequency?: number;
      isStream?: boolean;
    });

    on: <T extends keyof EventRes>(event: T, fn: EventProps<T>) => TelegramBot;

    getMe(): Out<User>;
    getUpdate(offset?: boolean): Out<TelegramUpdate>;
    sendMessage(
      chat_id: number | string,
      text: string,
      rest?: Partial<TelegramSendMessage>
    ): Out<TelegramMessage>;
    sendPhoto(
      chatId: number | string,
      photo: string | Buffer,
      caption?: string,
      rest?: Partial<TelegramSendPhoto>
    ): Out<TelegramMessage>;
    sendDocument(
      chatId: number | string,
      document: string | Buffer,
      caption?: string,
      rest?: any,
      fileName?: string
    ): Out<TelegramMessage>;
    sendSticker(
      chatId: number | string,
      sticker: string | InputSticker
    ): Out<TelegramMessage>;
    getFile(file_id: string): Out<TelegramFile>;
    downloadFile(path: string, fileOut: string): Out<boolean>;
    editMessageText(
      text: string,
      messageId: number,
      chatId: number,
      options: TelegramSendMessage
    ): Out<TelegramMessage>;
    deleteMessage(chatId: number, messageId: number): Out<boolean>;
  }
  /**
   * Generates InlineKeyboard that used for Telegram.
   * **The keybord-object is in res property.**
   */
  export class InlineKeyboardGenerator {
    /** Get Buttons for inline_keyboard field */
    res: TelegramButton[][];
    /** Add a row */
    newRow(): InlineKeyboardGenerator;
    /** Add a button to the last row */
    addBtn(text: string, callback_data: string): InlineKeyboardGenerator;
    /** Generate reply markup with inline keybaord that containts buttons */
    rm(): { reply_markup: ReplyMarkup };
  }
}

type Out<T> = Promise<T | null>;

type Cmd = { cmd: string; args: string[] };

type EventRes = {
  ready: (out: User) => void;
  update: (msg: BotMessage) => void;
  command: (cmd: { msg: BotMessage; ext: Cmd }) => void;
  callback: (cb: CallbackQuery & { args: string[] }) => void;
};
type EventSwitcher<T extends keyof EventRes> = EventRes[T];
type EventProps<T extends keyof EventRes> = EventSwitcher<T>;

type User = {
  id: number;

  first_name: string;
  last_name: string;
  username: string;

  language_code: string;

  isBot?: boolean;
  isPremium?: boolean;
};
type Chat =
  | {
    id: number;
    type: "group" | "supergroup" | "channel";
    title: string;
    is_forum: boolean;
  }
  | {
    id: number;
    type: "private";
    first_name?: string;
    last_name?: string;
    username?: string;
  };
type TelegramMessage = {
  message_id: number;

  from: User;
  chat: Chat;

  date: number;
  text?: string;

  animation?: TelegramAnimation;
  document?: Document;
  entities?: TelegramEntitiy[];
  caption?: string;

  sticker?: Sticker;

  media_group_id?: string;
  photo?: PhotoSize[];
  video?: Video;
};

type StickerType = "regular" | "mask" | "custom_emoji";
type Sticker = {
  file_id: string;
  file_unique_id: string;

  type: StickerType;

  width: number;
  height: number;

  is_animated: boolean;
  is_video: boolean;

  thumbnail?: TelegramFile;
  emoji?: String;
  set_name?: String;

  custom_emoji_id?: string;
  file_size?: number;
};
interface TelegramStickerSet {
  name: string;
  title: string;

  sticker_type: StickerType;

  stickers: Sticker[];
  thumbnail?: PhotoSize;
}
type BotTelegramMessage = TelegramMessage & {
  from: User & BotUser;
  chat: Chat & BotChat;
  delete: () => Promise<boolean>;
  edit: (
    text: string,
    replyMarkup?: {
      reply_markup: {
        inline_keyboard?: TelegramButton[][];
      };
    }
  ) => void;
};
interface PhotoSize {
  file_id: string;
  file_unique_id: string;

  width: number;
  height: number;

  file_size?: number;
}
interface Video {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumbnail?: PhotoSize[];
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}
interface TelegramAnimation {
  file_id;
  file_unique_id: string;

  width: number;
  height: number;

  duration: number;

  thumbnail?: PhotoSize;

  file_name?: string;
  mime_type?: string;
  file_size?: number;
}
interface Document {
  file_id: string;
  file_unique_id: string;

  file_name?: string;
  file_size?: string;
  mime_type?:
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/bmp"
  | "image/webp"
  | string;

  thumbnail?: PhotoSize;
}
type CallbackQuery = {
  id: string;

  from: User;
  message?: BotTelegramMessage;

  inline_message_id?: string;
  chat_instance: string;

  data?: string;

  args?: string[];
};
interface TelegramButton {
  text: string;

  callback_data?: string;

  url?: string;
}
interface TelegramSendMessage {
  parse_mode?: "MarkdownV2" | "html" | "Markdown";
  reply_markup?: {
    inline_keyboard?: TelegramButton[][];
  };
  reply_to_message?: TelegramMessage;
  reply_parameters?: {
    message_id: number;
    chat_id?: number | string;
    quote?: string;
  };
  message_effect_id?: keyof typeof messageEffectId;
}
interface TelegramSendPhoto {
  chat_id: number | string;
  parse_mode?: "MarkdownV2" | "html" | "Markdown";
  reply_markup?: string;
  caption?: string;
  photo: string | Buffer;
  show_caption_above_media?: boolean;
  reply_to_message?: TelegramMessage;
  reply_parameters?: {
    message_id: number;
    chat_id?: number | string;
    quote?: string;
  };
}

type TelegramResponse = {
  data: {
    ok: boolean;
    result: { [key: string]: any };
    error_code?: number;
    description?: string;
  };
};

type TelegramResponseUpdate = TelegramResponse & {
  data: {
    result: (
      | {
        update_id: number;
        message?: TelegramMessage;
      }
      | {
        update_id: number;
        callback_query: CallbackQuery;
      }
    )[];
  };
};
type TelegramUpdate =
  | {
    type: "message";
    message: BotMessage;
  }
  | {
    type: "callback_query";
    callback_query: CallbackQuery;
  };
type methods =
  | "getMe"
  | "getUpdates"
  | "sendMessage"
  | "sendPhoto"
  | "sendDocument"
  | "editMessageText"
  | "editMessageCaption"
  | "deleteMessage"
  | "getFile"
  | "sendSticker"
  | "getStickerSet"
  | "addStickerToSet"
  | "replaceStickerInSet"
  | "deleteStickerFromSet"
  | "deleteStickerSet"
  | "editMessageReplyMarkup"
  | "setStickerSetTitle";

type methodsPost =
  | "uploadStickerFile"
  | "createNewStickerSet"
  | "sendPhoto"
  | "sendDocument";
type TelegramEntitiy = {
  type:
  | "mention"
  | "hashtag"
  | "cashtag"
  | "bot_command"
  | "url"
  | "email"
  | "phone_number";
  offset: number;
  length: number;
};
interface TelegramFile {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
}
interface InputSticker {
  sticker: string | TelegramFile;
  format: "static" | "video" | "animated";
  emoji_list: string[];
}

type BotMessage = BotTelegramMessage & {
  reply: (text: string, rest?: TelegramSendMessage) => BotMessage;
}
interface BotUser {
  reply: (text: string, rest?: TelegramSendMessage) => any;
  write: (text: string, rest?: TelegramSendMessage) => any;
}
interface BotChat {
  write: (
    text: string,
    rest?: TelegramSendMessage
  ) => Promise<TelegramResponse>;
}

interface ReplyMarkup {
  inline_keyboard: TelegramButton[][];
}

interface ICreateNewStickerSet {
  userId: string;
  name: string;
  title: string;
  stickers: string;
  sticker_type?: "regular" | "mask" | "custom_emoji";
}
interface IAddStickerToSet {
  userId: string;
  name: string;
  sticker: string;
}
type TelegramGetUpdatesResponse = {
  update_id: number;

  message?: TelegramMessage;
  callback_query?: CallbackQuery;
  edited_message?: TelegramMessage;
}[];

interface TelegramError {
  ok: false;
  error_code: number;
  description: string;
}

export enum messageEffectId {
  "fire" = "5104841245755180586", //'🔥'
  "like" = "5107584321108051014", //'👍'
  "dislike" = "5104858069142078462", //'👎'
  "heart" = "5044134455711629726", //'❤️'
  "surprise" = "5046509860389126442", //'🎉'
  "poop" = "5046589136895476101", //'💩'
}
