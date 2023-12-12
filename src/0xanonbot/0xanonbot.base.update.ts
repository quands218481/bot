/* eslint-disable @typescript-eslint/no-unused-vars */
import { Ctx, InjectBot, Message } from 'nestjs-telegraf';
import { Scenes, Telegraf } from 'telegraf';
import { UsersService } from 'src/users/users.service';
import { JobsService } from 'src/jobs/jobs.service';
import { ChainId, ChainInfo, ChainList } from 'src/constants/chain-list';
import { MessagesService } from 'src/message/messages.service';
import { ethers } from 'ethers';
import { CreateJobDto } from 'src/jobs/dto/create-job.dto';
import { getErc20Balance } from 'src/app.util';
import { Zero0AnonService } from './0xanonbot.service';
import axios from 'axios';

export abstract class ZeroxAnonBotBaseUpdate {
  constructor(
    @InjectBot()
    protected readonly bot: Telegraf<Scenes.SceneContext>,
    protected readonly userService: UsersService,
    protected readonly jobService: JobsService,
    protected readonly rero0AnonService: Zero0AnonService,
    protected readonly messageService: MessagesService,
  ) {
    this.init();
    this.getNativeCoinInfomation();
  }

  _chain: ChainInfo;

  async init() {
    this._chain = ChainList[ChainId.Ethereum];
  }

  async showGasInfomation(@Ctx() ctx) {
    const editMessage = await ctx.reply(`Please wait a moment...`, {
      parse_mode: 'HTML',
    });
    this.getNativeCoinInfomation();
    this.editMessage(
      ctx,
      editMessage.chat.id,
      editMessage.message_id,
      this._nativeCoinInfomation,
      {
        parse_mode: 'HTML',
      },
    );
  }

  async searchToken(@Ctx() ctx, @Message() message) {
    const _mc = message.text.trim().toLowerCase();
    const token = this._chain.tokens[_mc];
    if (!ethers.isAddress(_mc) || !token) return;
    const editMessage = await ctx.reply(
      `<b>🔎  <a href="${this._chain.chart}/${token.address}">${token.name} (${token.symbol}) 📈</a> 🔍</b>
<b>CA:</b> <code>${token.address}</code>
<b>Supply:</b> -- ⬩ <b>Decimals:</b> ${token.decimals}`,
      {
        parse_mode: 'HTML',
      },
    );

    const walletExlorer = `${this._chain.explorer.root}${this._chain.explorer.address}`;

    const user = await this.userService.get(message.from.id);
    const tokenBalances = await Promise.all(
      user.wallets.map((w) =>
        getErc20Balance(
          this._chain.rpcProvider,
          token.address,
          w,
          this._chain.native.decimals,
        ),
      ),
    );

    let walletsString = '';
    for (const index in user.wallets) {
      const iw = index + 1;
      walletsString += `<b>▰ <a href="${walletExlorer}${user.wallets[index]}">Wallet⬩w${iw}</a></b>
<b>Balance:</b> ${tokenBalances[index]} ${token.symbol}
`;
    }

    this.editMessage(
      ctx,
      editMessage.chat.id,
      editMessage.message_id,
      `<b>🔎  <a href="${this._chain.chart}/${token.address}">${token.name} (${token.symbol}) 📈</a> 🔍</b>
<b>CA:</b> <code>${token.address}</code>
<b>Supply:</b> -- ⬩ <b>Decimals:</b> ${token.decimals}

<b> ═══ Your Wallets ═══</b>
${walletsString}`,
      {
        parse_mode: 'HTML',
      },
    );
  }

  async setupSession(@Ctx() ctx, telegramId: string) {
    try {
      const user = await this.userService.get(telegramId);
      ctx.session = {
        user: user,
        telegramId: telegramId,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async requestEnterPWFor(
    @Ctx() ctx,
    replyText,
    jobBuilder: (replyMessage) => CreateJobDto,
  ) {
    const replyMessage = await ctx.reply(replyText, {
      parse_mode: 'HTML',
      reply_markup: {
        force_reply: true,
      },
    });
    this.jobService.create(jobBuilder(replyMessage));
  }

  async warningReply(@Ctx() ctx, reply: string, time = 3000, options = {}) {
    this.shortReply(ctx, `⚠️ ${reply}`, time, options);
  }

  async shortReply(@Ctx() ctx, reply: string, time = 3000, options = {}) {
    try {
      const warningMessage = await ctx.reply(reply, {
        parse_mode: 'HTML',
        ...options,
      });
      const timer = setTimeout(() => {
        this.deleteMessage(
          ctx,
          warningMessage.chat.id,
          warningMessage.message_id,
        );
        clearTimeout(timer);
      }, time);
    } catch (error) {
      console.log('shortReply =======>', error);
    }
  }

  async editMessage(
    @Ctx() ctx,
    chatId: string,
    messageId: string,
    message: string,
    options = {},
  ) {
    try {
      return await ctx.telegram.editMessageText(
        chatId,
        messageId,
        messageId,
        message,
        {
          parse_mode: 'HTML',
          ...options,
        },
      );
    } catch (error) {
      console.log('editMessage =======>', error);
    }
  }

  async deleteMessage(@Ctx() ctx, chatId: string, messageId: string) {
    try {
      if (!chatId || !messageId) return;
      return await ctx.tg.deleteMessage(chatId, messageId);
    } catch (error) {
      console.log('deleteMessage =======>', error);
    }
  }

  _lastTimeUpdate = 0;
  _nativeCoinInfomation = `<b>Gas: -- GWEI ⬩Block: -- ⬩ETH: $ --</b>`;

  async getNativeCoinInfomation(): Promise<string> {
    let url = '';
    switch (this._chain.chainId) {
      case ChainId.BinanceSmartChain:
        url = 'https://min-api.cryptocompare.com/data/price?fsym=BNB&tsyms=USD';
        break;
      case ChainId.Ethereum:
        url = 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD';
        break;
      case ChainId.Arbitrum:
        url = 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD';
        break;
      case ChainId.Polygon:
        url = 'https://min-api.cryptocompare.com/data/price?fsym=PLG&tsyms=USD';
        break;
      default:
        break;
    }
    if (
      url &&
      (!this._lastTimeUpdate ||
        this._lastTimeUpdate + 60 * 60 * 1000 > new Date().getTime())
    ) {
      const response = await axios.get<object>(url);
      if (response.data && response.data['USD']) {
        this._lastTimeUpdate = new Date().getTime();
        this._nativeCoinInfomation = `<b>Gas: 3 GWEI ⬩Block: 30454234 ⬩${this._chain.native.symbol}: $${response.data['USD']}</b>`;
      }
    }
    return this._nativeCoinInfomation;
  }

  _extractErrorMessage(error): string {
    let errorMessage = '⚠️ ';
    if (
      error.response &&
      error.response.data &&
      error.response.data.description
    ) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMessage += error.response.data.description;
    } else if (
      error.response &&
      error.response.data &&
      error.response.data.message
    ) {
      errorMessage += error.response.data.message;
    } else if (error.info && error.info.error && error.info.error.message) {
      // Something happened in setting up the request that triggered an Error
      errorMessage += error.info.error.message;
    } else if (
      error.response &&
      error.response.data &&
      error.response.data.validationErrors &&
      error.response.data.validationErrors.length > 0
    ) {
      errorMessage += error.response.data.validationErrors[0]['reason'];
    } else if (
      error.response &&
      error.response.data &&
      error.response.data.reason
    ) {
      errorMessage += error.response.data.reason;
    } else {
      errorMessage += error.message;
    }

    return errorMessage;
  }
}
