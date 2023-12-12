import { Ctx, Message } from 'nestjs-telegraf';
import { ZeroxAnonBotWithdrawUpdate } from './0xanonbot.withdraw.update';
import { GetLastMessageDto } from 'src/message/dto/get-last-message.dto';
import { MessageType } from 'src/message/types/message-type';
import { MessageSwapParams } from 'src/message/types/message-swap-params';
import { CreateMessageDto } from 'src/message/dto/create-message.dto';
import { CallbackData, KeyCallbackData, NewSwapParamsBuilder } from './type';
import { GetMessageDto } from 'src/message/dto/get-message.dto';
import { UpdateMessageDto } from 'src/message/dto/update-message.dto';
import { Job } from 'src/jobs/schemas/job.schema';
import { JobStatus } from 'src/jobs/types/job-status';
import { JobMessageParams } from 'src/jobs/types/job-message-params';
import { CreateJobDto } from 'src/jobs/dto/create-job.dto';
import { JobAction } from 'src/jobs/types/job-action';
import { verifySecretKey } from 'src/app.util';
import { ethers } from 'ethers';

export abstract class ZeroxAnonBotSwapUpdate extends ZeroxAnonBotWithdrawUpdate {
  async onEnterPWForSwap(
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
        '<b>📝 Enter password to swap:</b>',
        (replyMessage) =>
          new CreateJobDto(
            message.from.id,
            JobAction.ENTER_PW_FOR_SWAP,
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

    this.swap(ctx, chatId, messageId);

    return JobStatus.done;
  }

  async swap(@Ctx() ctx, chatId, messageId) {
    const m = await this.messageService.get(
      new GetMessageDto(chatId, messageId),
    );
    if (!m) {
      /// Show warning
      this.warningReply(ctx, 'Something wrong, please try again!');
      return JobStatus.cancel;
    }
    const params = MessageSwapParams.fromJSON(m.params);
    const info = verifySecretKey(params.sceretKey);
    const editMessage = await ctx.reply('Please wait a moment...', {
      parse_mode: 'HTML',
    });
    this.rero0AnonService
      .swap({
        privateKey: info['privateKey'],
        type: 'swap',
        recipient: params.recipient,
        targetToken: params.token,
        amountOutMin: '0',
      })
      .then((data) => {
        console.log('SWAP FROM SERVER ======>', data);
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
          this.changeSwapParams(ctx, chatId, messageId, (settings) => {
            settings.sceretKey = '';
            settings.recipient = '';
            settings.token = '';
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
        console.log('onEnterPWForSwap =========>', error);
      });
  }

  async onEnterSwapToken(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const token: string = message.text.trim().toLowerCase();
    const { chatId, messageId, replyChatId, replyId } =
      JobMessageParams.fromJSON(job.params);

    if (!ethers.isAddress(token) || !this._chain.tokens[token]) {
      /// Show warning
      if (!ethers.isAddress(token)) {
        this.warningReply(
          ctx,
          'Can’t find the liquidity pool. Please check and enter contract again.',
        );
      } else {
        this.warningReply(
          ctx,
          'Can’t find the liquidity pool. Please check and enter contract again.',
        );
      }
      /// delete your answer
      this.deleteMessage(ctx, message.chat.id, message.message_id);
      /// Delete request
      this.deleteMessage(ctx, replyChatId, replyId);
      /// Create new request
      this.requestEnterSwapToken(ctx, chatId, messageId);
      return JobStatus.cancel;
    }
    this.changeSwapParams(ctx, chatId, messageId, (settings) => {
      settings.token = token;
      return settings;
    });
    return JobStatus.done;
  }

  async onEnterSwapRecipient(
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
      this.requestEnterSwapRecipient(ctx, chatId, messageId);
      return JobStatus.cancel;
    }
    this.changeSwapParams(ctx, chatId, messageId, (settings) => {
      settings.recipient = recipient;
      return settings;
    });
    return JobStatus.done;
  }

  async onEnterSwapSecretKey(
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
      this.requestEnterSwapSecretKey(ctx, chatId, messageId);
      return JobStatus.cancel;
    }
    this.changeSwapParams(ctx, chatId, messageId, (settings) => {
      settings.sceretKey = secretKey;
      return settings;
    });
    return JobStatus.done;
  }
  async onEnterSwapSlippage(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const slippage: number = parseFloat(message.text.trim());
    const { chatId, messageId, replyChatId, replyId } =
      JobMessageParams.fromJSON(job.params);

    if (Number.isNaN(slippage) || slippage < 1 || slippage > 100) {
      /// Show warning
      if (slippage < 1 || slippage > 100) {
        this.warningReply(ctx, `Slippage must be between 1-100%.`);
      } else {
        this.warningReply(ctx, 'Invalid slippage!');
      }
      /// delete your answer
      this.deleteMessage(ctx, message.chat.id, message.message_id);
      /// Delete request
      this.deleteMessage(ctx, replyChatId, replyId);
      /// Create new request
      this.requestEnterSwapSlippage(ctx, chatId, messageId);
      return JobStatus.cancel;
    }
    this.changeSwapParams(ctx, chatId, messageId, (settings) => {
      settings.slippage = slippage / 100;
      return settings;
    });
    return JobStatus.done;
  }
  async changeSwapParams(
    @Ctx() ctx,
    chatId: string,
    messageId: string,
    newParamsBuilder: NewSwapParamsBuilder,
  ) {
    try {
      const message = await this.messageService.get(
        new GetMessageDto(chatId, messageId),
      );
      const newSettings = await newParamsBuilder(
        MessageSwapParams.fromJSON(message.params),
      );
      const updated = await this.messageService.update(
        new UpdateMessageDto(
          chatId,
          messageId,
          newSettings.toJSON(),
          MessageType.SWAP,
        ),
      );
      if (!updated) return;

      this.editMessage(
        ctx,
        chatId,
        messageId,
        `<b>🛠 Swap</b>
<b>-Slippage</b>: <a href="https://help.coinbase.com/en/coinbase/trading-and-funding/advanced-trade/slippage">Definition</a>
${this._nativeCoinInfomation}`,
        await this.buildSwapMenu(newSettings, message.telegramId),
      );

      if (newSettings.validate()) {
        this.swap(ctx, chatId, messageId);
      }
    } catch (error) {
      console.log('changeSwapParams ====> ', error);
    }
  }

  async requestEnterSwapToken(@Ctx() ctx, chatId: string, messageId: string) {
    try {
      const message = await this.messageService.get(
        new GetMessageDto(chatId, messageId),
      );
      const replyMessage = await ctx.reply('<b>🛠 Enter token:</b>', {
        parse_mode: 'HTML',
        reply_markup: {
          force_reply: true,
        },
      });
      this.jobService.create(
        new CreateJobDto(
          message.telegramId,
          JobAction.ENTER_SWAP_TOKEN,
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
      console.log('requestEnterSwapToken ========>', error);
    }
  }

  async requestSwapConfirm(@Ctx() ctx, chatId: string, messageId: string) {
    try {
      const message = await this.messageService.get(
        new GetMessageDto(chatId, messageId),
      );
      this.requestEnterPWFor(
        ctx,
        '<b>📝 Enter password to swap:</b>',
        (replyMessage) =>
          new CreateJobDto(
            message.telegramId,
            JobAction.ENTER_PW_FOR_SWAP,
            JobStatus.inProcess,
            new JobMessageParams(
              message.chatId,
              message.messageId,
              replyMessage.chat.id,
              replyMessage.message_id,
            ).toJSON(),
          ),
      );
    } catch (error) {
      console.log('requestSwapConfirm ========>', error);
    }
  }

  async requestEnterSwapRecipient(
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
          JobAction.ENTER_SWAP_RECIPIENT,
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
      console.log('requestEnterSwapRecipient ========>', error);
    }
  }

  async requestEnterSwapSlippage(
    @Ctx() ctx,
    chatId: string,
    messageId: string,
  ) {
    try {
      const message = await this.messageService.get(
        new GetMessageDto(chatId, messageId),
      );
      const replyMessage = await ctx.reply('<b>🛠 Enter slippage:</b>', {
        parse_mode: 'HTML',
        reply_markup: {
          force_reply: true,
        },
      });
      this.jobService.create(
        new CreateJobDto(
          message.telegramId,
          JobAction.ENTER_SWAP_SLIPPAGE,
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
      console.log('requestEnterSwapSlippage ========>', error);
    }
  }

  async requestEnterSwapSecretKey(
    @Ctx() ctx,
    chatId: string,
    messageId: string,
  ) {
    try {
      const message = await this.messageService.get(
        new GetMessageDto(chatId, messageId),
      );
      const replyMessage = await ctx.reply('<b>🛠 Enter secret key:</b>', {
        parse_mode: 'HTML',
        reply_markup: {
          force_reply: true,
        },
      });
      this.jobService.create(
        new CreateJobDto(
          message.telegramId,
          JobAction.ENTER_SWAP_SECRET_KEY,
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
      console.log('requestEnterSwapSecretKey ========>', error);
    }
  }

  async showSwapMenu(@Ctx() ctx, telegramId: string) {
    let lastMessage;
    try {
      lastMessage = await this.messageService.getLast(
        new GetLastMessageDto(telegramId, MessageType.SWAP),
      );
    } catch (error) {
      console.log(error);
    }
    try {
      const swapParams = lastMessage
        ? MessageSwapParams.fromJSON(lastMessage.params)
        : new MessageSwapParams(
            '', // sceretKey
            '', // token
            0.01,
            '',
            true,
          );
      const { chat, message_id } = await ctx.reply(
        `<b>🛠 Swap Token</b>
<b>-Slippage</b>: <a href="https://help.coinbase.com/en/coinbase/trading-and-funding/advanced-trade/slippage">Definition</a>
  ${this._nativeCoinInfomation}`,
        await this.buildSwapMenu(swapParams, telegramId),
      );
      const message = await this.messageService.create(
        new CreateMessageDto(
          chat.id,
          message_id,
          telegramId,
          swapParams.toJSON(),
          MessageType.SWAP,
        ),
      );
      if (!!message) {
        // this.requestEnterBuyTokenAddress(ctx, chat.id, message_id);
      }
    } catch (error) {
      console.log('showBuySettings ========>', error);
    }
  }

  async buildSwapMenu(params: MessageSwapParams, telegramId: string) {
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
            KeyCallbackData.SWAP_ENTER_SECRET_KEY,
            telegramId,
          ).toJSON(),
        },
      ],
      [
        {
          text: ethers.isAddress(params.token)
            ? `✅ ${params.token}`
            : '📝 Enter Token Address',
          callback_data: new CallbackData<string>(
            KeyCallbackData.SWAP_ENTER_TOKEN,
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
            KeyCallbackData.SWAP_ENTER_RECIPIENT,
            telegramId,
          ).toJSON(),
        },
      ],
      [
        {
          text: params.relayer
            ? '👁‍🗨Anon transaction: 🟢'
            : '👁‍🗨Anon transaction: 🔴',
          callback_data: new CallbackData<boolean>(
            KeyCallbackData.SWAP_RELAYER,
            !params.relayer,
          ).toJSON(),
        },
      ],
      [
        {
          text: '▓▓▓▓▓ SLIPPAGE ▓▓▓▓▓',
          callback_data: new CallbackData<string>(
            KeyCallbackData.NONE,
            telegramId,
          ).toJSON(),
        },
      ],
      [
        {
          text: params.slippage == 0.01 ? `1% ✅` : `1%`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.SWAP_SLIPPAGE_OPTION,
            0.01,
          ).toJSON(),
        },
        {
          text: params.slippage == 0.03 ? `3% ✅` : `3%`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.SWAP_SLIPPAGE_OPTION,
            0.03,
          ).toJSON(),
        },
        {
          text: params.slippage == 0.05 ? `5% ✅` : `5%`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.SWAP_SLIPPAGE_OPTION,
            0.05,
          ).toJSON(),
        },
      ],
      [
        {
          text: params.slippage == 0.1 ? `10% ✅` : `10%`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.SWAP_SLIPPAGE_OPTION,
            0.1,
          ).toJSON(),
        },
        {
          text: params.slippage == 0.2 ? `20% ✅` : `20%`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.SWAP_SLIPPAGE_OPTION,
            0.2,
          ).toJSON(),
        },
        {
          text: ![0, 0.01, 0.03, 0.05, 0.1, 0.2].some(
            (a) => a == params.slippage,
          )
            ? `Custom: ${params.slippage * 100}% ✅`
            : 'Custom: --',
          callback_data: new CallbackData<string>(
            KeyCallbackData.SWAP_ENTER_SLIPPAGE,
            telegramId,
          ).toJSON(),
        },
      ],
    ];
    // if (params.validate()) {
    //   inlineKeyboard = [
    //     ...inlineKeyboard,
    //     [
    //       {
    //         text: 'SWAP',
    //         callback_data: new CallbackData<string>(
    //           KeyCallbackData.SWAP_CONFIRM,
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
