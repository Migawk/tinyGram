type TelegramUser = {
  id: number;

  first_name: string;
  last_name: string;
  username: string;

  language_code: string;

  is_bot?: boolean;
  is_premium?: boolean;
};
type TelegramChat =
  | {
    id: number;
    type: "group" | "supergroup" | "channel";
    title: stirng;
    is_forum: boolean;
  }
  | {
    id: number;
    type: "private";
    first_name?: string;
    last_name?: string;
    username?: string;
  };
type TelegramChatFullInfo =
  | {
    id: number;
    type: "group" | "supergroup" | "channel";
    title: stirng;
    is_forum: boolean;
  }
  | {
    id: number;
    type: "private";
    first_name?: string;
    last_name?: string;
    username?: string;
    birthdate: {
      day: number;
      month: number;
      year?: number;
    };
    active_usernames?: string[];
    bio?: string;
    personal_chat?: {
      username?: string;
      title?: string;
    };
  };
type TelegramMessage = {
  message_id: number;

  from: User;
  chat: TelegramChat;

  date: number;
  text?: string;

  animation?: TelegramAnimation;
  document?: TelegramDocument;
  entities?: TelegramEntitiy[];
  caption?: string;

  sticker?: Sticker;

  media_group_id?: string;
  photo?: PhotoSize[];
  video?: Video;
};
type TelegramGetUpdatesResponse = {
  update_id: number;

  message?: TelegramMessage;
  callback_query?: CallbackQuery;
  edited_message?: TelegramMessage;
  pre_checkout_query?: PreCheckoutQuery;
}[];
type StickerType = "regular" | "mask" | "custom_emoji";
type TelegramSticker = {
  file_id: string;
  file_unique_id: string;

  type: StickerType;

  width: number;
  height: number;

  is_animated: boolean;
  is_video: boolean;

  thumbnail?: TelegramFile;
  emoji?: string;
  set_name?: string;

  custom_emoji_id?: string;
  file_size?: number;
};
interface TelegramStickerSet {
  name: string;
  title: string;

  sticker_type: StickerType;

  stickers: TelegramSticker[];
  thumbnail?: PhotoSize;
}
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
interface TelegramDocument {
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
  message?: TelegramMessage;

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
type TelegramResponse<T = any> =
  | {
    ok: true;
    result: T;
  }
  | {
    ok: false;
    result: T;
    description?: string;
  };
type TelegramResponseUpdate = TelegramResponse & {
  data: {
    result: { update_id: number } & (
      | {
        message: TelegramMessage;
      }
      | {
        callback_query: CallbackQuery;
      }
      | {
        checkoutQuery: PreCheckoutQuery;
      }
    )[];
  };
};

type TelegramUpdate =
  {
    type: "message";
  } & TelegramMessageParsed
  | {
    type: "callback_query";
    callback_query: CallbackQuery;
  }
  | {
    type: "checkoutQuery";
    checkoutQuery: PreCheckoutQuery
  };
type AvailableMethodsGet =
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
  | "setStickerSetTitle"
  | "getChat"
  | "sendInvoice"
  | "answerPreCheckoutQuery";

type AvalableMethodsPost =
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
  sticker: stirng | TelegramFile;
  format: "static" | "video" | "animated";
  emoji_list: string[];
}

type BotTelegramMessage = TelegramMessage & {
  from: TelegramUser & BotUser;
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
type TelegramMessageParsed = BotTelegramMessage & {
  reply: (text: string, rest?: TelegramSendMessage) => TelegramMessageParsed;
};
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

// Bodies for requesting. GET/POST.
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
interface TelegramError {
  ok: false;
  error_code?: number;
  description?: string;
}
enum messageEffectId {
  "fire" = "5104841245755180586", //'🔥'
  "like" = "5107584321108051014", //'👍'
  "dislike" = "5104858069142078462", //'👎'
  "heart" = "5044134455711629726", //'❤️'
  "surprise" = "5046509860389126442", //'🎉'
  "poop" = "5046589136895476101", //'💩'
}

type LabelPrice = {
  label: string
  amount: number
}
type PreCheckoutQuery = {
  id: string;
  from: TelegramUser;
  currency: "USD" | "EUR";
  total_amount: number;
  invoice_payload: string;
}