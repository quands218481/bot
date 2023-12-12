import { Ctx, Message } from 'nestjs-telegraf';
import { ZeroxAnonBotDepositUpdate } from './0xanonbot.deposit.update';
import { MessageType } from 'src/message/types/message-type';
import { GetLastMessageDto } from 'src/message/dto/get-last-message.dto';
import { MessageWithdrawParams } from 'src/message/types/message-withdraw-params';
import { CreateMessageDto } from 'src/message/dto/create-message.dto';
import {
  CallbackData,
  KeyCallbackData,
  NewWithdrawParamsBuilder,
} from './type';
import { GetMessageDto } from 'src/message/dto/get-message.dto';
import { CreateJobDto } from 'src/jobs/dto/create-job.dto';
import { JobAction } from 'src/jobs/types/job-action';
import { JobStatus } from 'src/jobs/types/job-status';
import { JobMessageParams } from 'src/jobs/types/job-message-params';
import { Job } from 'src/jobs/schemas/job.schema';
import { verifySecretKey } from 'src/app.util';
import { UpdateMessageDto } from 'src/message/dto/update-message.dto';
import { ethers } from 'ethers';

export abstract class ZeroxAnonBotWithdrawUpdate extends ZeroxAnonBotDepositUpdate {
  async onEnterPWForWithdraw(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const password: string = message.text.trim();
    const { chatId, messageId, replyChatId, replyId } =
      JobMessageParams.fromJSON(job.params);

    const telegramId = message.from.id;

    /// delete your answer
    this.deleteMessage(ctx, message.chat.id, message.message_id);

    /// Delete request
    this.deleteMessage(ctx, replyChatId, replyId);

    if (!(await this.userService.verifyPassword(telegramId, password))) {
      /// Show warning
      this.warningReply(ctx, 'Wrong password!');
      /// Create new request
      this.requestEnterPWFor(
        ctx,
        '<b>📝 Enter password to withdraw:</b>',
        (replyMessage) =>
          new CreateJobDto(
            message.from.id,
            JobAction.ENTER_PW_FOR_WITHDRAW,
            JobStatus.inProcess,
            new JobMessageParams(
              chatId,
              messageId,
              replyMessage.chat.id,
              replyMessage.message_id,
            ).toJSON(),
          ),
      );
      return JobStatus.cancel;
    }
    this.withdraw(ctx, chatId, messageId);
    return JobStatus.done;
  }

  async withdraw(@Ctx() ctx, chatId, messageId) {
    const m = await this.messageService.get(
      new GetMessageDto(chatId, messageId),
    );
    if (!m) {
      /// Show warning
      this.warningReply(ctx, 'Something wrong, please try again!');
      return JobStatus.cancel;
    }
    const params = MessageWithdrawParams.fromJSON(m.params);

    const info = verifySecretKey(params.sceretKey);
    const editMessage = await ctx.reply('Please wait a moment...', {
      parse_mode: 'HTML',
    });
    this.rero0AnonService
      .withdraw({
        privateKey: info['privateKey'],
        type: 'withdraw',
        recipient: params.recipient,
        usedRelayer: params.relayer,
      })
      .then((data) => {
        console.log('WITHDRAW FROM SERVER ======>', data);
        if (data.result == 1) {
          this.editMessage(
            ctx,
            editMessage.chat.id,
            editMessage.message_id,
            `<b>🔎 TxHash: <a href="${this._chain.explorer.root}${this._chain.explorer.tx}/${data.res.hash}">${data.res.hash}</a> 🔍</b>
<b>Secret Key:</b> <code>${params.sceretKey}</code>
<b>Status: Successful</b>`,
            {
              parse_mode: 'HTML',
            },
          );
          this.changeWithdrawParams(ctx, chatId, messageId, (settings) => {
            settings.sceretKey = '';
            settings.recipient = '';
            return settings;
          });
        } else {
          throw data.message;
        }
      })
      .catch((error) => {
        this.editMessage(
          ctx,
          editMessage.chat.id,
          editMessage.message_id,
          `<b>Secret Key:</b> <code>${params.sceretKey}</code>
    <b>Status: Failure</b>`,
          {
            parse_mode: 'HTML',
          },
        );
        console.log('onEnterPWForWithdraw =========>', error);
      });
  }

  async onEnterWithdrawRecipient(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const recipient: string = message.text.trim();
    const { chatId, messageId, replyChatId, replyId } =
      JobMessageParams.fromJSON(job.params);

    if (!ethers.isAddress(recipient)) {
      /// Show warning
      this.warningReply(ctx, 'Invalid recipient!');
      /// delete your answer
      this.deleteMessage(ctx, message.chat.id, message.message_id);
      /// Delete request
      this.deleteMessage(ctx, replyChatId, replyId);
      /// Create new request
      this.requestEnterWithdrawRecipient(ctx, chatId, messageId);
      return JobStatus.cancel;
    }
    this.changeWithdrawParams(ctx, chatId, messageId, (settings) => {
      settings.recipient = recipient;
      return settings;
    });
    return JobStatus.done;
  }

  async onEnterWithdrawSecretKey(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const secretKey: string = message.text.trim();
    const { chatId, messageId, replyChatId, replyId } =
      JobMessageParams.fromJSON(job.params);

    if (!verifySecretKey(secretKey)) {
      /// Show warning
      this.warningReply(ctx, 'Invalid secret key!');
      /// delete your answer
      this.deleteMessage(ctx, message.chat.id, message.message_id);
      /// Delete request
      this.deleteMessage(ctx, replyChatId, replyId);
      /// Create new request
      this.requestEnterWithdrawSecretKey(ctx, chatId, messageId);
      return JobStatus.cancel;
    }
    this.changeWithdrawParams(ctx, chatId, messageId, (settings) => {
      settings.sceretKey = secretKey;
      return settings;
    });
    return JobStatus.done;
  }

  async requestWithdrawConfirm(@Ctx() ctx, chatId: string, messageId: string) {
    const message = await this.messageService.get(
      new GetMessageDto(chatId, messageId),
    );
    this.requestEnterPWFor(
      ctx,
      '<b>📝 Enter password to withdraw:</b>',
      (replyMessage) =>
        new CreateJobDto(
          message.telegramId,
          JobAction.ENTER_PW_FOR_WITHDRAW,
          JobStatus.inProcess,
          new JobMessageParams(
            message.chatId,
            message.messageId,
            replyMessage.chat.id,
            replyMessage.message_id,
          ).toJSON(),
        ),
    );
  }

  async requestEnterWithdrawRecipient(
    @Ctx() ctx,
    chatId: string,
    messageId: string,
  ) {
    try {
      const message = await this.messageService.get(
        new GetMessageDto(chatId, messageId),
      );
      const replyMessage = await ctx.reply('<b>🛠 Enter recipient:</b>', {
        parse_mode: 'HTML',
        reply_markup: {
          force_reply: true,
        },
      });
      this.jobService.create(
        new CreateJobDto(
          message.telegramId,
          JobAction.ENTER_WITHDRAW_RECIPIENT,
          JobStatus.inProcess,
          new JobMessageParams(
            chatId,
            messageId,
            replyMessage.chat.id,
            replyMessage.message_id,
          ).toJSON(),
        ),
      );
    } catch (error) {
      console.log('requestEnterWithdrawRecipient ========>', error);
    }
  }

  async requestEnterWithdrawSecretKey(
    @Ctx() ctx,
    chatId: string,
    messageId: string,
  ) {
    try {
      const message = await this.messageService.get(
        new GetMessageDto(chatId, messageId),
      );
      const replyMessage = await ctx.reply('<b>🛠 Enter a secret key:</b>', {
        parse_mode: 'HTML',
        reply_markup: {
          force_reply: true,
        },
      });
      this.jobService.create(
        new CreateJobDto(
          message.telegramId,
          JobAction.ENTER_WITHDRAW_SECRET_KEY,
          JobStatus.inProcess,
          new JobMessageParams(
            chatId,
            messageId,
            replyMessage.chat.id,
            replyMessage.message_id,
          ).toJSON(),
        ),
      );
    } catch (error) {
      console.log('requestEnterWithdrawSecretKey ========>', error);
    }
  }

  async changeWithdrawParams(
    @Ctx() ctx,
    chatId: string,
    messageId: string,
    newParamsBuilder: NewWithdrawParamsBuilder,
  ) {
    try {
      const message = await this.messageService.get(
        new GetMessageDto(chatId, messageId),
      );
      const newSettings = await newParamsBuilder(
        MessageWithdrawParams.fromJSON(message.params),
      );
      const updated = await this.messageService.update(
        new UpdateMessageDto(
          chatId,
          messageId,
          newSettings.toJSON(),
          MessageType.WITHDRAW,
        ),
      );
      if (!updated) return;

      this.editMessage(
        ctx,
        chatId,
        messageId,
        `<b>🛠 Withdraw</b>
<b>-Slippage</b>: <a href="https://help.coinbase.com/en/coinbase/trading-and-funding/advanced-trade/slippage">Definition</a>
${this._nativeCoinInfomation}`,
        await this.buildWithdrawMenu(newSettings, message.telegramId),
      );

      if (newSettings.validate()) {
        this.withdraw(ctx, chatId, messageId);
      }
    } catch (error) {
      console.log('changeBuySettings ====> ', error);
    }
  }

  async showWithdrawMenu(@Ctx() ctx, telegramId: string) {
    let lastMessage;
    try {
      lastMessage = await this.messageService.getLast(
        new GetLastMessageDto(telegramId, MessageType.WITHDRAW),
      );
    } catch (error) {
      console.log(error);
    }
    try {
      const withdrawParams = lastMessage
        ? MessageWithdrawParams.fromJSON(lastMessage.params)
        : new MessageWithdrawParams(
            '', // sceretKey
            '', // recipient
            true, // relayer
          );
      const { chat, message_id } = await ctx.reply(
        `<b>🛠 Withdraw</b> 
  ${this._nativeCoinInfomation}`,
        await this.buildWithdrawMenu(withdrawParams, telegramId),
      );
      const message = await this.messageService.create(
        new CreateMessageDto(
          chat.id,
          message_id,
          telegramId,
          withdrawParams.toJSON(),
          MessageType.WITHDRAW,
        ),
      );
      if (!!message) {
        // this.requestEnterBuyTokenAddress(ctx, chat.id, message_id);
      }
    } catch (error) {
      console.log('showWithdrawMenu ========>', error);
    }
  }

  async buildWithdrawMenu(params: MessageWithdrawParams, telegramId: string) {
    const inlineKeyboard = [
      [
        {
          text: '↰ Main Menu',
          callback_data: new CallbackData<string>(
            KeyCallbackData.MAINMENU,
            telegramId,
          ).toJSON(),
        },
        {
          text: '✖ Close',
          callback_data: new CallbackData<string>(
            KeyCallbackData.CLOSE,
            telegramId,
          ).toJSON(),
        },
      ],
      [
        {
          text: verifySecretKey(params.sceretKey)
            ? `✅ ${params.sceretKey}`
            : '📝 Enter Secret Key',
          callback_data: new CallbackData<string>(
            KeyCallbackData.WITHDRAW_ENTER_SECRET_KEY,
            telegramId,
          ).toJSON(),
        },
      ],
      [
        {
          text: ethers.isAddress(params.recipient)
            ? `✅ ${params.recipient}`
            : '📝 Enter Recipient',
          callback_data: new CallbackData<string>(
            KeyCallbackData.WITHDRAW_ENTER_RECIPIENT,
            telegramId,
          ).toJSON(),
        },
      ],
      [
        {
          text: params.relayer
            ? '👁‍🗨Anon transaction 🟢'
            : '👁‍🗨Anon transaction: 🔴',
          callback_data: new CallbackData<boolean>(
            KeyCallbackData.WITHDRAW_RELAYER,
            !params.relayer,
          ).toJSON(),
        },
      ],
    ];
    // if (params.validate()) {
    //   inlineKeyboard = [
    //     ...inlineKeyboard,
    //     [
    //       {
    //         text: 'WITHDRAW',
    //         callback_data: new CallbackData<string>(
    //           KeyCallbackData.WITHDRAW_CONFIRM,
    //           telegramId,
    //         ).toJSON(),
    //       },
    //     ],
    //   ];
    // }
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    };
  }
}
