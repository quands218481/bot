import { Ctx, Message } from 'nestjs-telegraf';
import { ZeroxAnonBotBaseUpdate } from './0xanonbot.base.update';
import { MessageType } from 'src/message/types/message-type';
import { GetLastMessageDto } from 'src/message/dto/get-last-message.dto';
import { CreateMessageDto } from 'src/message/dto/create-message.dto';
import { CallbackData, KeyCallbackData, NewDepositParamsBuilder } from './type';
import { MessageDepositParams } from 'src/message/types/message-deposit-params';
import { GetMessageDto } from 'src/message/dto/get-message.dto';
import { UpdateMessageDto } from 'src/message/dto/update-message.dto';
import { CreateJobDto } from 'src/jobs/dto/create-job.dto';
import { JobAction } from 'src/jobs/types/job-action';
import { JobStatus } from 'src/jobs/types/job-status';
import { JobMessageParams } from 'src/jobs/types/job-message-params';
import { Job } from 'src/jobs/schemas/job.schema';
import { decryptData, withDecimals } from 'src/app.util';
import * as depositAbi from '../abis/deposit.json';
import { ethers } from 'ethers';
import { DEPOSIT_ADDRESS } from 'src/constants/contract-address';
import { v4 as uuidv4 } from 'uuid';

export abstract class ZeroxAnonBotDepositUpdate extends ZeroxAnonBotBaseUpdate {
  async onEnterPWForDeposit(
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
        '<b>📝 Enter password to deposit:</b>',
        (replyMessage) =>
          new CreateJobDto(
            message.from.id,
            JobAction.ENTER_PW_FOR_DEPOSIT,
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
    const m = await this.messageService.get(
      new GetMessageDto(chatId, messageId),
    );
    if (!m) {
      /// Show warning
      this.warningReply(ctx, 'Something wrong, please try again!');
      return JobStatus.cancel;
    }
    const user = await this.userService.get(telegramId);
    const params = MessageDepositParams.fromJSON(m.params);
    const privateKeys = params.wallets.map((index) => {
      return decryptData(user.privateKeys[index], password);
    });
    for (const privateKey of privateKeys) {
      const wallet = new ethers.Wallet(privateKey, this._chain.rpcProvider);
      const contract = new ethers.Contract(DEPOSIT_ADDRESS, depositAbi, wallet);
      const _publicKey = uuidv4();
      const _privateKey = uuidv4();
      const amount = withDecimals(params.amount, this._chain.native.decimals);
      const secretKey =
        '0xAnon:' + amount + ':' + _publicKey + ':' + _privateKey;
      const editMessage = await ctx.reply('Please wait a moment...', {
        parse_mode: 'HTML',
      });
      contract
        .deposit(_publicKey, {
          value: amount,
        })
        .then((transaction) => {
          console.log('DEPOSIT FROM SMART CONTRACT ======>', transaction);
          this.rero0AnonService
            .deposit({
              publicKey: _publicKey,
              privateKey: _privateKey,
              amount: amount,
              chain: 'ethereum',
              txHash: transaction.hash,
              account: wallet.address,
            })
            .then((data) => {
              console.log('DEPOSIT FROM SERVER ======>', data);
              if (data.result == 1) {
                this.editMessage(
                  ctx,
                  editMessage.chat.id,
                  editMessage.message_id,
                  `<b>🔎 TxHash: <a href="${this._chain.explorer.root}${this._chain.explorer.tx}/${transaction.hash}">${transaction.hash}</a> 🔍</b>
<b>Secret Key:</b> <code>${secretKey}</code>
<b>Status: Successful</b>`,
                  {
                    parse_mode: 'HTML',
                  },
                );
              } else {
                throw data.message;
              }
            })
            .catch((error) => {
              this.editMessage(
                ctx,
                editMessage.chat.id,
                editMessage.message_id,
                `<b>🔎 TxHash: <a href="${this._chain.explorer.root}${this._chain.explorer.tx}/${transaction.hash}">${transaction.hash}</a> 🔍</b>
<b>Secret Key:</b> <code>${secretKey}</code>
<b>Status: Failure</b>`,
                {
                  parse_mode: 'HTML',
                },
              );
              console.log('onEnterPWForDeposit =========>', error);
            });
        })
        .catch((error) => {
          this.editMessage(
            ctx,
            editMessage.chat.id,
            editMessage.message_id,
            `<b>🔎 TxHash: --🔍</b>
      <b>Secret Key:</b> <code>${secretKey}</code>
      <b>Status: Failure</b>`,
            {
              parse_mode: 'HTML',
            },
          );
          console.log('onEnterPWForDeposit =========>', error);
        });
    }
    return JobStatus.done;
  }

  async requestDepositConfirm(@Ctx() ctx, chatId: string, messageId: string) {
    const message = await this.messageService.get(
      new GetMessageDto(chatId, messageId),
    );
    this.requestEnterPWFor(
      ctx,
      '<b>📝 Enter password to deposit:</b>',
      (replyMessage) =>
        new CreateJobDto(
          message.telegramId,
          JobAction.ENTER_PW_FOR_DEPOSIT,
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

  async onEnterDepositAmount(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const amount: number = parseFloat(message.text.trim());
    const { chatId, messageId, replyChatId, replyId } =
      JobMessageParams.fromJSON(job.params);

    if (Number.isNaN(amount) || amount < 0.01) {
      /// Show warning
      if (amount < 0.01) {
        this.warningReply(ctx, `Amount must be greater than 0.01`);
      } else {
        this.warningReply(ctx, 'Invalid amount!');
      }
      /// delete your answer
      this.deleteMessage(ctx, message.chat.id, message.message_id);
      /// Delete request
      this.deleteMessage(ctx, replyChatId, replyId);
      /// Create new request
      this.requestEnterDepositAmount(ctx, chatId, messageId);
      return JobStatus.cancel;
    }
    this.changeDepositParams(ctx, chatId, messageId, (settings) => {
      settings.amount = amount;
      return settings;
    });
    return JobStatus.done;
  }

  async requestEnterDepositAmount(
    @Ctx() ctx,
    chatId: string,
    messageId: string,
  ) {
    try {
      const message = await this.messageService.get(
        new GetMessageDto(chatId, messageId),
      );
      const replyMessage = await ctx.reply('<b>🛠 Enter a custom amount:</b>', {
        parse_mode: 'HTML',
        reply_markup: {
          force_reply: true,
        },
      });
      this.jobService.create(
        new CreateJobDto(
          message.telegramId,
          JobAction.ENTER_DEPOSIT_AMOUNT,
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
      console.log('requestEnterDepositAmount ========>', error);
    }
  }

  async changeDepositParams(
    @Ctx() ctx,
    chatId: string,
    messageId: string,
    newParamsBuilder: NewDepositParamsBuilder,
  ) {
    try {
      const message = await this.messageService.get(
        new GetMessageDto(chatId, messageId),
      );
      const newSettings = await newParamsBuilder(
        MessageDepositParams.fromJSON(message.params),
      );
      const updated = await this.messageService.update(
        new UpdateMessageDto(
          chatId,
          messageId,
          newSettings.toJSON(),
          MessageType.DEPOSIT,
        ),
      );
      if (!updated) return;

      this.editMessage(
        ctx,
        chatId,
        messageId,
        `<b>🛠 Deposit</b>
<b>-Slippage</b>: <a href="https://help.coinbase.com/en/coinbase/trading-and-funding/advanced-trade/slippage">Definition</a>
${this._nativeCoinInfomation}`,
        await this.buildDepositMenu(newSettings, message.telegramId),
      );

      if (newSettings.validate()) {
        this.requestDepositConfirm(ctx, chatId, messageId);
      }
    } catch (error) {
      console.log('changeBuySettings ====> ', error);
    }
  }

  async showDepositMenu(@Ctx() ctx, telegramId: string) {
    let lastMessage;
    try {
      lastMessage = await this.messageService.getLast(
        new GetLastMessageDto(telegramId, MessageType.DEPOSIT),
      );
    } catch (error) {
      console.log(error);
    }
    try {
      const depositParams = lastMessage
        ? MessageDepositParams.fromJSON(lastMessage.params)
        : new MessageDepositParams(
            [], // wallets
            0.01, // amount
          );
      const { chat, message_id } = await ctx.reply(
        `<b>🛠 Deposit</b> 
  <b>-Deposit Amount</b>: the amt of ${this._chain.native.symbol} to spend
  ${this._nativeCoinInfomation}`,
        await this.buildDepositMenu(depositParams, telegramId),
      );
      const message = await this.messageService.create(
        new CreateMessageDto(
          chat.id,
          message_id,
          telegramId,
          depositParams.toJSON(),
          MessageType.DEPOSIT,
        ),
      );
      if (!!message) {
        // this.requestEnterBuyTokenAddress(ctx, chat.id, message_id);
      }
    } catch (error) {
      console.log('showDepositMenu ========>', error);
    }
  }

  async buildDepositMenu(params: MessageDepositParams, telegramId: string) {
    const user = await this.userService.get(telegramId);
    const unitToken = this._chain.native;
    const wallets = [[]];
    for (const key in user.wallets) {
      if (wallets[wallets.length - 1].length > 1) {
        wallets.push([]);
      }

      const index = parseInt(key);
      if (index % 2 == 0) {
        if (!wallets[wallets.length - 1]) {
          wallets[wallets.length - 1] = [];
        }
      }

      const iw = index + 1;
      wallets[wallets.length - 1].push({
        text: params.wallets.includes(index) ? `w${iw} ✅` : `w${iw}`,
        callback_data: new CallbackData<number>(
          KeyCallbackData.DEPOSIT_WALLET_OPTION,
          parseInt(key),
        ).toJSON(),
      });
    }
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
          text: '▓▓▓▓▓ SELECT WALLETS ▓▓▓▓▓',
          callback_data: new CallbackData<string>(
            KeyCallbackData.NONE,
            telegramId,
          ).toJSON(),
        },
      ],
      ...wallets,
      [
        {
          text: '▓▓▓▓▓ DEPOSIT AMOUNT ▓▓▓▓▓',
          callback_data: new CallbackData<string>(
            KeyCallbackData.NONE,
            telegramId,
          ).toJSON(),
        },
      ],
      [
        {
          text:
            params.amount == 0.01
              ? `0.01 ${unitToken.symbol} ✅`
              : `0.01 ${unitToken.symbol}`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.DEPOSIT_AMOUNT_OPTION,
            0.01,
          ).toJSON(),
        },
        {
          text:
            params.amount == 0.05
              ? `0.05 ${unitToken.symbol} ✅`
              : `0.05 ${unitToken.symbol}`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.DEPOSIT_AMOUNT_OPTION,
            0.05,
          ).toJSON(),
        },
        {
          text:
            params.amount == 0.1
              ? `0.1 ${unitToken.symbol} ✅`
              : `0.1 ${unitToken.symbol}`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.DEPOSIT_AMOUNT_OPTION,
            0.1,
          ).toJSON(),
        },
        {
          text:
            params.amount == 0.5
              ? `0.5 ${unitToken.symbol} ✅`
              : `0.5 ${unitToken.symbol}`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.DEPOSIT_AMOUNT_OPTION,
            0.5,
          ).toJSON(),
        },
      ],
      [
        {
          text:
            params.amount == 1
              ? `1 ${unitToken.symbol} ✅`
              : `1 ${unitToken.symbol}`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.DEPOSIT_AMOUNT_OPTION,
            1,
          ).toJSON(),
        },
        {
          text:
            params.amount == 2
              ? `2 ${unitToken.symbol} ✅`
              : `2 ${unitToken.symbol}`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.DEPOSIT_AMOUNT_OPTION,
            2,
          ).toJSON(),
        },
        {
          text:
            params.amount == 5
              ? `5 ${unitToken.symbol} ✅`
              : `5 ${unitToken.symbol}`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.DEPOSIT_AMOUNT_OPTION,
            5,
          ).toJSON(),
        },
        {
          text:
            params.amount == 10
              ? `10 ${unitToken.symbol} ✅`
              : `10 ${unitToken.symbol}`,
          callback_data: new CallbackData<number>(
            KeyCallbackData.DEPOSIT_AMOUNT_OPTION,
            10,
          ).toJSON(),
        },
        // {
        //   text: ![0, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10].some((a) => a == params.amount)
        //     ? `Custom: ${params.amount} ${unitToken.symbol} ✅`
        //     : 'Custom: --',
        //   callback_data: new CallbackData<string>(
        //     KeyCallbackData.DEPOSIT_ENTER_AMOUNT,
        //     telegramId,
        //   ).toJSON(),
        // },
      ],
    ];
    // if (params.validate()) {
    //   inlineKeyboard = [
    //     ...inlineKeyboard,
    //     [
    //       {
    //         text: 'DEPOSIT',
    //         callback_data: new CallbackData<string>(
    //           KeyCallbackData.DEPOSIT_CONFIRM,
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
