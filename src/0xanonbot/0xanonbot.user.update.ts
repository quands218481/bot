import { Ctx, Message } from 'nestjs-telegraf';
import { CreateJobDto } from 'src/jobs/dto/create-job.dto';
import { JobMessageParams } from 'src/jobs/types/job-message-params';
import { JobAction } from 'src/jobs/types/job-action';
import { JobStatus } from 'src/jobs/types/job-status';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ethers } from 'ethers';
import { CallbackData, KeyCallbackData, WParams } from './type';
import { JobReplaceWalletParams } from 'src/jobs/types/job-replace-wallet-params';
import {
  decryptData,
  encryptData,
  getNativeBalance,
  verifyPrivateKey,
} from 'src/app.util';
import { Job } from 'src/jobs/schemas/job.schema';
import { ChangePasswordDto } from 'src/users/dto/change-password.dto';
import { JobChangePasswordParams } from 'src/jobs/types/job-chain-password-params';
import { webInfo } from 'src/constants/web-info';
import { ZeroxAnonBotSwapUpdate } from './0xanonbot.swap.update';
import { ImportWalletDto } from 'src/users/dto/import-wallet';
import { JobPrivateKeyImportParams } from 'src/jobs/types/job-private-key-import-params';
import { JobPrivateKeyReplaceParams } from 'src/jobs/types/job-private-key-replace-params';
import { ReplaceWalletDto } from 'src/users/dto/replace-wallet';

export abstract class ZeroxAnonBotUserUpdate extends ZeroxAnonBotSwapUpdate {
  async showRegisterMenu(@Ctx() ctx, telegramId: string) {
    ctx.reply(
      `<b>🟢 Welcome to ⬩ 0xAnon ⬩ <a href="${webInfo.baseURL}">Website</a> 🟢</b>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Register',
                callback_data: new CallbackData<string>(
                  KeyCallbackData.REGISTER,
                  telegramId,
                ).toJSON(),
              },
            ],
          ],
        },
      },
    );
  }

  async showWalletsInfomation(@Ctx() ctx, telegramId: string) {
    try {
      const user = await this.userService.get(telegramId);
      if (!!user) {
        const editMessage = await ctx.reply(`Please wait a moment ...`, {
          parse_mode: 'HTML',
        });
        const walletInfomation = await this.getWalletInfomationMessage(
          telegramId,
        );
        this.editMessage(
          ctx,
          editMessage.chat.id,
          editMessage.message_id,
          `<b>🟢 0xAnon ⬩ <a href="${webInfo.baseURL}">Website</a> 🟢</b>

${walletInfomation}`,
        );
      } else {
        this.showRegisterMenu(ctx, telegramId);
      }
    } catch (error) {
      console.log('showWalletsInfomation =======>', error);
    }
  }

  async register(@Ctx() ctx, telegramId: string) {
    try {
      const user = await this.userService.get(telegramId);
      if (!!user) return;
      const replyMessage = await ctx.reply(
        `<b>🔐 Enter a password. Once a password is set, you will need to enter your password to view your private keys or make a transfer. </b> 
<i>Passwords cannot be recovered so make sure you remember your password.</i>`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            force_reply: true,
          },
        },
      );
      this.jobService.create(
        new CreateJobDto(
          telegramId,
          JobAction.RESGITER,
          JobStatus.inProcess,
          new JobMessageParams(
            null,
            null,
            replyMessage.chat.id,
            replyMessage.message_id,
          ).toJSON(),
        ),
      );
    } catch (error) {
      console.log('register =========>', error);
    }
  }

  async onRegister(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const password = message.text.trim();
    const { replyChatId, replyId } = JobMessageParams.fromJSON(job.params);

    /// delete old request
    this.deleteMessage(ctx, replyChatId, replyId);

    if (!password) {
      /// show warning
      this.warningReply(ctx, 'Password is empty!');

      /// new request
      this.register(ctx, message.from.id);
      return JobStatus.cancel;
    }

    const privateKeys = [
      ethers.Wallet.createRandom(this._chain.rpcProvider).privateKey,
    ];

    const user = await this.userService.create(
      new CreateUserDto(message.from.id, password, privateKeys),
    );

    if (!user) {
      this.warningReply(ctx, 'Something wrong, please try again!');
      return JobStatus.cancel;
    }

    this.deleteMessage(ctx, message.chat.id, message.message_id);

    this.showMainMenu(ctx, message.from.id);

    return JobStatus.done;
  }

  async onChangePW(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const password = message.text.trim();
    const { replyChatId, replyId } = JobMessageParams.fromJSON(job.params);

    /// delete old request
    this.deleteMessage(ctx, replyChatId, replyId);

    /// delete current message
    this.deleteMessage(ctx, message.chat.id, message.message_id);

    if (!password) {
      /// show warning
      this.warningReply(ctx, 'Password is empty!');

      /// new request
      this.requestChangePW(ctx, message.from.id);
      return JobStatus.cancel;
    }

    this.requestEnterPWFor(
      ctx,
      '<b>📝 Enter password to confirm:</b>',
      (replyMessage) =>
        new CreateJobDto(
          message.from.id,
          JobAction.ENTER_PW_FOR_CHANGE_PW,
          JobStatus.inProcess,
          new JobChangePasswordParams(
            encryptData(password, process.env.CECURITY_KEY),
            replyMessage.chat.id,
            replyMessage.message_id,
          ).toJSON(),
        ),
    );

    return JobStatus.done;
  }

  async onEnterPWShowWalletWithPK(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const password: string = message.text.trim();
    const { replyChatId, replyId } = JobMessageParams.fromJSON(job.params);
    /// delete old request
    this.deleteMessage(ctx, replyChatId, replyId);

    /// delete current message
    this.deleteMessage(ctx, message.chat.id, message.message_id);

    if (!(await this.userService.verifyPassword(message.from.id, password))) {
      /// Show warning
      this.warningReply(ctx, 'Wrong password!');
      /// New request
      this.requestEnterPWFor(
        ctx,
        '<b>📝 Enter password to confirm:</b>',
        (replyMessage) =>
          new CreateJobDto(
            message.from.id,
            JobAction.ENTER_PW_FOR_SHOW_PK,
            JobStatus.inProcess,
            new JobMessageParams(
              replyMessage.chat.id,
              replyMessage.message_id,
              replyMessage.chat.id,
              replyMessage.message_id,
            ).toJSON(),
          ),
      );
      return JobStatus.cancel;
    }
    const walletInfomation = await this.getWalletInfomationMessage(
      message.from.id,
      password,
    );
    this.shortReply(
      ctx,
      `<b>Your Wallet Private Keys</b>
Use these private keys to import your wallets to Metamask.
    
<i>Disclaimer: You are responsible for your funds once private keys are revealed. Please exercise extreme caution with these private keys.</i>
    
${walletInfomation}
    
<i>⚠️ For your security and privacy, this message will be automatically deleted in 5 minutes.</i>`,
      5 * 60 * 1000,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✖ Close',
                callback_data: new CallbackData<string>(
                  KeyCallbackData.CLOSE,
                  message.from.id,
                ).toJSON(),
              },
            ],
          ],
        },
      },
    );
    return JobStatus.done;
  }

  async onEnterPWChangePW(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const password: string = message.text.trim();
    const { newPassword, replyChatId, replyId } =
      JobChangePasswordParams.fromJSON(job.params);
    /// delete old request
    this.deleteMessage(ctx, replyChatId, replyId);

    /// delete current message
    this.deleteMessage(ctx, message.chat.id, message.message_id);

    if (!(await this.userService.verifyPassword(message.from.id, password))) {
      /// Show warning
      this.warningReply(ctx, 'Wrong password!');
      /// New request
      this.requestEnterPWFor(
        ctx,
        '<b>📝 Enter password to confirm:</b>',
        (replyMessage) =>
          new CreateJobDto(
            message.from.id,
            JobAction.ENTER_PW_FOR_CHANGE_PW,
            JobStatus.inProcess,
            new JobChangePasswordParams(
              newPassword,
              replyMessage.chat.id,
              replyMessage.message_id,
            ).toJSON(),
          ),
      );
      return JobStatus.cancel;
    }
    const updated = this.userService.changePassword(
      new ChangePasswordDto(
        message.from.id,
        decryptData(newPassword, process.env.CECURITY_KEY),
        password,
      ),
    );
    if (!updated) {
      this.warningReply(ctx, 'Change password failure!');
      return JobStatus.cancel;
    }
    this.shortReply(ctx, 'Changed password sucessful!');
    return JobStatus.done;
  }

  async onEnterPWForImportW(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const password: string = message.text.trim();
    const { privateKey, replyChatId, replyId } =
      JobPrivateKeyImportParams.fromJSON(job.params);

    /// delete old request
    this.deleteMessage(ctx, replyChatId, replyId);

    /// delete current message
    this.deleteMessage(ctx, message.chat.id, message.message_id);

    if (!(await this.userService.verifyPassword(message.from.id, password))) {
      /// Show warning
      this.warningReply(ctx, 'Wrong password!');
      /// New request
      this.requestEnterPWFor(
        ctx,
        '<b>📝 Enter password to confirm:</b>',
        (replyMessage) =>
          new CreateJobDto(
            message.from.id,
            JobAction.ENTER_PW_FOR_IMPORT_W,
            JobStatus.inProcess,
            new JobPrivateKeyImportParams(
              privateKey,
              replyMessage.chat.id,
              replyMessage.message_id,
            ).toJSON(),
          ),
      );
      return JobStatus.cancel;
    }
    const updated = this.userService.importWallet(
      new ImportWalletDto(
        message.from.id,
        password,
        decryptData(privateKey, process.env.CECURITY_KEY),
      ),
    );
    if (!updated) {
      this.warningReply(ctx, 'Import wallet failure!');
      return JobStatus.cancel;
    }
    this.shortReply(
      ctx,
      'Imported wallet sucessful! Now you can sell/buy token.',
    );
    this.showMainMenu(ctx, message.from.id);
    return JobStatus.done;
  }

  async onEnterPWForReplaceW(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const password: string = message.text.trim();
    const { walletIndex, privateKey, replyChatId, replyId } =
      JobPrivateKeyReplaceParams.fromJSON(job.params);

    /// delete old request
    this.deleteMessage(ctx, replyChatId, replyId);

    /// delete current message
    this.deleteMessage(ctx, message.chat.id, message.message_id);

    if (!(await this.userService.verifyPassword(message.from.id, password))) {
      /// Show warning
      this.warningReply(ctx, 'Wrong password!');
      /// New request
      this.requestEnterPWFor(
        ctx,
        '<b>📝 Enter password to confirm:</b>',
        (replyMessage) =>
          new CreateJobDto(
            message.from.id,
            JobAction.ENTER_PW_FOR_REPLACE_W,
            JobStatus.inProcess,
            new JobPrivateKeyReplaceParams(
              walletIndex,
              privateKey,
              replyMessage.chat.id,
              replyMessage.message_id,
            ).toJSON(),
          ),
      );
      return JobStatus.cancel;
    }
    const updated = this.userService.replaceWallet(
      new ReplaceWalletDto(
        message.from.id,
        password,
        decryptData(privateKey, process.env.CECURITY_KEY),
        walletIndex,
      ),
    );
    if (!updated) {
      this.warningReply(ctx, 'Replace wallet failure!');
      return JobStatus.cancel;
    }
    this.shortReply(
      ctx,
      'Replaced wallet sucessful! Now you can sell/buy token.',
    );
    this.showMainMenu(ctx, message.from.id);
    return JobStatus.done;
  }

  async onEnterPKForReplaceW(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const privateKey: string = message.text.trim();
    const { walletIndex, replyChatId, replyId } =
      JobReplaceWalletParams.fromJSON(job.params);

    /// delete old request
    this.deleteMessage(ctx, replyChatId, replyId);

    /// delete current message
    this.deleteMessage(ctx, message.chat.id, message.message_id);

    if (!verifyPrivateKey(privateKey)) {
      /// Show warning
      this.warningReply(ctx, 'Invalid private key!');

      /// Create new request
      this.requestReplaceWallet(ctx, message.from.id, walletIndex);
      return JobStatus.cancel;
    }

    this.requestEnterPWFor(
      ctx,
      '<b>📝 Enter password to confirm:</b>',
      (replyMessage) =>
        new CreateJobDto(
          message.from.id,
          JobAction.ENTER_PW_FOR_REPLACE_W,
          JobStatus.inProcess,
          new JobPrivateKeyReplaceParams(
            walletIndex,
            encryptData(privateKey, process.env.CECURITY_KEY),
            replyMessage.chat.id,
            replyMessage.message_id,
          ).toJSON(),
        ),
    );

    return JobStatus.done;
  }

  async showReplaceWalletMenu(@Ctx() ctx, telegramId: string) {
    ctx.reply(
      `<b>🔧 Replace Wallet - Replace an existing wallet by importing your wallet using a private key. Which wallet do you want to replace?</b> 

⚠️ Warning: Replaced wallets cannot be recovered.`,
      await this.buildWalletsSettings(telegramId),
    );
  }

  async requestImportWallet(@Ctx() ctx, telegramId: string) {
    const replyMessage = await ctx.reply(
      `<b>🔧 Import Wallet - Import an new wallet by importing your wallet using a private key. Which wallet do you want to import?</b>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          force_reply: true,
        },
      },
    );

    this.jobService.create(
      new CreateJobDto(
        telegramId,
        JobAction.ENTER_PK_FOR_IMPORT_W,
        JobStatus.inProcess,
        new JobMessageParams(
          null,
          null,
          replyMessage.chat.id,
          replyMessage.message_id,
        ).toJSON(),
      ),
    );
  }

  async showMainMenu(@Ctx() ctx, telegramId: string) {
    try {
      const editMessage = await ctx.reply(
        `<b>🟢 0xAnon ⬩ <a href="${webInfo.baseURL}">Website</a> 🟢</b>

${this._nativeCoinInfomation}

<b> ═══ Your Wallets ═══ </b>
<i>Loading...</i>
`,
        this.buildMainMenuSettings(telegramId),
      );
      const walletInfomation = await this.getWalletInfomationMessage(
        telegramId,
      );
      this.editMessage(
        ctx,
        editMessage.chat.id,
        editMessage.message_id,
        `<b>🟢 0xAnon ⬩ <a href="${webInfo.baseURL}">Website</a> 🟢</b>
${this._nativeCoinInfomation}

${walletInfomation}`,
        this.buildMainMenuSettings(telegramId),
      );
    } catch (error) {
      console.log('showMainMenu =======>', error);
    }
  }

  async showSettingsMenu(@Ctx() ctx, telegramId: string) {
    ctx.reply(`<b>⚙️ Settings ⚙️</b>`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
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
              text: 'Replace Wallet',
              callback_data: new CallbackData<string>(
                KeyCallbackData.REPLACEW,
                telegramId,
              ).toJSON(),
            },
            {
              text: 'Import Wallet',
              callback_data: new CallbackData<string>(
                KeyCallbackData.IMPORTW,
                telegramId,
              ).toJSON(),
            },
          ],
          [
            {
              text: 'Private Key',
              callback_data: new CallbackData<string>(
                KeyCallbackData.SHOWPKW,
                telegramId,
              ).toJSON(),
            },
            {
              text: 'Change Password',
              callback_data: new CallbackData<string>(
                KeyCallbackData.CHANGEPW,
                telegramId,
              ).toJSON(),
            },
          ],
        ],
      },
    });
  }

  async requestChangePW(@Ctx() ctx, telegramId: string) {
    const replyMessage = await ctx.reply('<b>📝 Enter new password</b>', {
      parse_mode: 'HTML',
      reply_markup: {
        force_reply: true,
      },
    });

    this.jobService.create(
      new CreateJobDto(
        telegramId,
        JobAction.ENTER_PW_FOR_CHANGE_PW,
        JobStatus.inProcess,
        new JobMessageParams(
          null,
          null,
          replyMessage.chat.id,
          replyMessage.message_id,
        ).toJSON(),
      ),
    );
  }

  async buildWalletsSettings(telegramId: string) {
    const user = await this.userService.get(telegramId);
    if (!user) {
      return '';
    }
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

      wallets[wallets.length - 1].push({
        text: `w${index + 1}`,
        callback_data: new CallbackData<WParams>(KeyCallbackData.REPLACEONW, {
          telId: telegramId,
          index: index,
        }).toJSON(),
      });
    }
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...wallets,
          [
            {
              text: '✖ Close',
              callback_data: new CallbackData<string>(
                KeyCallbackData.CLOSE,
                telegramId,
              ).toJSON(),
            },
          ],
        ],
      },
    };
  }

  buildMainMenuSettings(telegramId: string) {
    return {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Deposit',
              callback_data: new CallbackData<string>(
                KeyCallbackData.DEPOSIT,
                telegramId,
              ).toJSON(),
            },
          ],
          [
            {
              text: 'Withdraw',
              callback_data: new CallbackData<string>(
                KeyCallbackData.WITHDRAW,
                telegramId,
              ).toJSON(),
            },
            {
              text: 'Swap',
              callback_data: new CallbackData<string>(
                KeyCallbackData.SWAP,
                telegramId,
              ).toJSON(),
            },
          ],
          [
            {
              text: 'Settings',
              callback_data: new CallbackData<string>(
                KeyCallbackData.SETTINGS,
                telegramId,
              ).toJSON(),
            },
          ],
        ],
      },
    };
  }

  async requestShowWalletsWithPK(@Ctx() ctx, telegramId: string) {
    this.requestEnterPWFor(
      ctx,
      '<b>📝 Enter password to confirm:</b>',
      (replyMessage) =>
        new CreateJobDto(
          telegramId,
          JobAction.ENTER_PW_FOR_SHOW_PK,
          JobStatus.inProcess,
          new JobMessageParams(
            replyMessage.chat.id,
            replyMessage.message_id,
            replyMessage.chat.id,
            replyMessage.message_id,
          ).toJSON(),
        ),
    );
  }

  async onEnterPKForImportW(
    @Ctx() ctx,
    @Message() message,
    job: Job,
  ): Promise<JobStatus> {
    const privateKey: string = message.text.trim();
    const { replyChatId, replyId } = JobMessageParams.fromJSON(job.params);

    /// delete old request
    this.deleteMessage(ctx, replyChatId, replyId);

    /// delete current message
    this.deleteMessage(ctx, message.chat.id, message.message_id);

    if (!verifyPrivateKey(privateKey)) {
      /// Show warning
      this.warningReply(ctx, 'Invalid private key!');

      /// Create new request
      this.requestImportWallet(ctx, message.from.id);
      return JobStatus.cancel;
    }

    this.requestEnterPWFor(
      ctx,
      '<b>📝 Enter password to confirm:</b>',
      (replyMessage) =>
        new CreateJobDto(
          message.from.id,
          JobAction.ENTER_PW_FOR_IMPORT_W,
          JobStatus.inProcess,
          new JobPrivateKeyImportParams(
            encryptData(privateKey, process.env.CECURITY_KEY),
            replyMessage.chat.id,
            replyMessage.message_id,
          ).toJSON(),
        ),
    );
    return JobStatus.done;
  }

  async requestReplaceWallet(
    @Ctx() ctx,
    telegramId: string,
    walletIndex: number,
  ) {
    try {
      const iw = walletIndex + 1;
      const replyMessage = await ctx.reply(
        `<b>🔧 Replace Wallet - Enter the private key of the wallet you wish to replace. This will replace wallet w${iw}.</b>

⚠️ Warning: Replaced wallets cannot be recovered.`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            force_reply: true,
          },
        },
      );

      this.jobService.create(
        new CreateJobDto(
          telegramId,
          JobAction.ENTER_PK_FOR_REPLACE_W,
          JobStatus.inProcess,
          new JobReplaceWalletParams(
            walletIndex,
            replyMessage.chat.id,
            replyMessage.message_id,
          ).toJSON(),
        ),
      );
    } catch (error) {
      console.log('requestEnterBuyLimitTokenAddress ========>', error);
    }
  }

  async getWalletInfomationMessage(
    telegramId: string,
    password = null,
  ): Promise<string> {
    const user = await this.userService.get(telegramId);
    if (!user) {
      return '';
    }
    const nativeBalances = await Promise.all(
      user.wallets.map((w) =>
        getNativeBalance(
          this._chain.rpcProvider,
          w,
          this._chain.native.decimals,
        ),
      ),
    );

    let privatekeys = [];
    if (password) {
      privatekeys = user.privateKeys.map((pk) => decryptData(pk, password));
    }

    const transactionCounts = await Promise.all(
      user.wallets.map((w) => this._chain.rpcProvider.getTransactionCount(w)),
    );

    const walletExlorer = `${this._chain.explorer.root}${this._chain.explorer.address}`;

    let message = '<b> ═══ Your Wallets ═══</b>';
    for (const index in transactionCounts) {
      const iw = parseInt(index) + 1;
      message += `
<b>▰ <a href="${walletExlorer}${user.wallets[index]}">Wallet ⬩ w${iw}</a></b>
<b>Balance:</b> ${nativeBalances[index]} ${this._chain.native.symbol}
<b>Transactions:</b> ${transactionCounts[index]}
<b>Address:</b> <code>${user.wallets[index]}</code>`;
      if (privatekeys[index]) {
        message += `<b>PrivateKey:</b> <code>${privatekeys[index]}</code>`;
      }
    }

    return message;
  }
}
