# TelegramBot
**Good to know**: those methods returns in only on success. Otherwise it may occur telegram error and bad response.

## Methods
### .getMe(): Promise\<TelegramUser\>
- **Description**: Retrieves basic information about the bot, including its username and ID.

### .getUpdate(offset: boolean = false): Promise\<TelegramUpdate\>
- **Description**: Retrieves incoming updates (mostly are messages and callbacks) for the bot. This method can be used to poll for new messages.

### .sendMessage(chat_id: number | string,text: string,rest?: Partial\<TelegramSendMessage\>)
- **Description**: Sends a text message to a specified chat.

### .sendPhoto(chatId: number | string,photo: string | Buffer,caption?: string,rest?: Partial\<TelegramSendPhoto\>): Promise\<TelegramMessage\>
- **Description**: Sends a photo to a specified chat.

### .sendDocument(chatId: number | string,document: string | Buffer,caption?: string,rest?: any,fileName?: string): Promise\<TelegramMessage\>
- **Description**: Sends a document to a specified chat.

### .sendSticker(chatId: number | string, sticker: string | InputSticker): Promise\<TelegramMessage\>
- **Description**: Sends a sticker to a specified chat.

### .getFile(file_id: string): Promise\<TelegramFile\>
- **Description**: Retrieves a file from Telegram servers using its file ID.

### .downloadFile<FilePath extends string>(path: string, fileOut: FilePath): Promise\<FilePath | null\>
- **Description**: Downloads a file from Telegram servers to a specified local path.

### .editMessageText(text: string,messageId: number,chatId: number,options: TelegramSendMessage): Promise\<TelegramMessage\>
- **Description**: Edits the text of a message sent by the bot.

### .editMessageCaption(caption: string,messageId?: number,chatId?: number): Promise\<TelegramMessage\>
- **Description**: Edits the caption of a message sent by the bot.

### .editMessageReplyMarkup(messageId?: number,chatId?: number,replyMarkup?: ReplyMarkup): Promise\<TelegramMessage\>
- **Description**: Edits the reply markup (inline keyboard) of a message sent by the bot.

### .deleteMessage(chatId: number, messageId: number): Promise\<TelegramMessage\>
- **Description**: Deletes a message sent by the bot.

### .getStickerSet(name: string): Promise\<TelegramStickerSet\>
- **Description**: Retrieves information about a sticker set by its name.

### .createNewStickerSet({userId,name,title,stickers,sticker_type = "regular"}): Promise\<TelegramStickerSet\>
- **Description**: Creates a new sticker set for a user.

### .uploadStickerFile(userId: string,sticker: Blob, sticker_format: "static" | "animated" | "video" = "static"): Promise\<TelegramFile\>
- **Description**: Uploads a sticker file to Telegram servers.

### .addStickerToSet(userId: string, name: string, sticker: string): Promise\<boolean\>
- **Description**: Adds a new sticker to an existing sticker set.

### .deleteStickerFromSet(fileId: string): Promise\<boolean\>
- **Description**: Deletes a sticker from a sticker set.

### .replaceStickerInSet(userId: string, name: string, oldFileId: string, sticker: InputSticker): Promise\<boolean\>
- **Description**: Use this method to replace an existing sticker in a sticker set with a new one. The method is equivalent to calling deleteStickerFromSet, then addStickerToSet, then setStickerPositionInSet. Returns True on success.

### .deleteStickerSet(name: string): Promise\<boolean\>
- **Description**: Use this method to delete a sticker set that was created by the bot. Returns True on success.

### .setStickerSetTitle(name: string, title: string): Promise\<boolean\>
- Use this method to set the title of a created sticker set. Returns True on success.

### .getChat(id: number): Promise\<TelegramChat | TelegramUser\>
- Use this method to get up-to-date information about the chat. `In telegram docs said that you may provide string as username, but it's fake. You cannot. PROVIDE ONLY ID.`


## Constants
### .frequency: number
- (Mutable) How often the bot should make request to the telegram. Changes when there has not been updates long time.

### .initFrequency: number
- How often the bot should make request.

### .bot: Object
- Information about bot.
- Contains:
- - id: string,
- - is_bot: boolean,
- - username: string,
- - can_join_groups: boolean


# InlineKeyboardGenerator
## Methods
### .addBtn(text: string, callback_data: string): this
- **Description**: add a button to the last row.
### .newRow(): this
- **Description**: generate new row.
### .rm(): Partial\<TelegramSendMessage\>
- **Description**: prepare object for sending. Converts to Partial<TelegramSendMessage> that can be used by most of sending methods.
## Constans
### .res: TelegramButtons[][]
- **Description**: Contains an array of arrays with buttons.