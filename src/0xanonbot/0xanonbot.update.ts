/* eslint-disable @typescript-eslint/no-unused-vars */
import { Start, Update, Command, Message, Ctx, On } from 'nestjs-telegraf';
import { KeyCallbackData, CallbackData, WParams } from './type';
import { JobAction } from 'src/jobs/types/job-action';
import { JobStatus } from 'src/jobs/types/job-status';
import { UpdateJobStatusDto } from 'src/jobs/dto/update-job-status.dto';
import { ZeroxAnonBotUserUpdate } from './0xanonbot.user.update';

@Update()
export class ZeroxAnonBotUpdate extends ZeroxAnonBotUserUpdate {
  /// BEGIN: ========================== START ==========================
  /// STEP1: Check user have resgisted
  /// STEP2: registed => open menu, or no => open registed message
  /// STEP3: check last job user did

  @Start()
  async onStart(@Ctx() ctx, @Message() message) {
    this.setupSession(ctx, message.from.id);
    this.welcome(ctx, message.from.id);
  }

  @Command('menu')
  async menu(@Ctx() ctx, @Message() message) {
    this.setupSession(ctx, message.from.id);
    this.welcome(ctx, message.from.id);
  }

  @Command('wallets')
  async wallets(@Ctx() ctx, @Message() message) {
    this.showWalletsInfomation(ctx, message.from.id);
  }

  @Command('gas')
  async gas(@Ctx() ctx, @Message() message) {
    this.showGasInfomation(ctx);
  }

  /// END: ========================== START ==========================

  /// BEGIN: ========================== CALLBACK ==========================
  @On('callback_query')
  async onCallbackQuery(@Ctx() ctx) {
    try {
      if (ctx.update && ctx.update.callback_query) {
        const { data, message } = ctx.update.callback_query;
        const callback_data = CallbackData.fromJSON<any>(data);
        switch (callback_data.key) {
          case KeyCallbackData.REGISTER:
            this.register(ctx, callback_data.params);
            break;
          case KeyCallbackData.MAINMENU:
            this.welcome(ctx, callback_data.params);
            break;
          case KeyCallbackData.CLOSE:
            this.deleteMessage(ctx, message.chat.id, message.message_id);
            break;
          case KeyCallbackData.SETTINGS:
            this.showSettingsMenu(ctx, callback_data.params);
            break;
          case KeyCallbackData.REPLACEW:
            this.showReplaceWalletMenu(ctx, callback_data.params);
            break;
          case KeyCallbackData.REPLACEONW:
            const data = callback_data.params as WParams;
            this.requestReplaceWallet(ctx, data.telId, data.index);
            break;
          case KeyCallbackData.IMPORTW:
            this.requestImportWallet(ctx, callback_data.params);
            break;
          case KeyCallbackData.CHANGEPW:
            this.requestChangePW(ctx, callback_data.params);
            break;
          case KeyCallbackData.SHOWPKW:
            this.requestShowWalletsWithPK(ctx, callback_data.params);
            break;
          case KeyCallbackData.DEPOSIT:
            this.showDepositMenu(ctx, callback_data.params);
            break;
          case KeyCallbackData.DEPOSIT_WALLET_OPTION:
            this.changeDepositParams(
              ctx,
              message.chat.id,
              message.message_id,
              (settings) => {
                const walletIndex = callback_data.params as number;
                let wallets = [];
                if (!settings.wallets.includes(walletIndex)) {
                  wallets = [...settings.wallets, walletIndex];
                } else {
                  wallets = settings.wallets.filter((w) => w != walletIndex);
                }
                settings.wallets = wallets;
                return settings;
              },
            );
            break;
          case KeyCallbackData.DEPOSIT_AMOUNT_OPTION:
            this.changeDepositParams(
              ctx,
              message.chat.id,
              message.message_id,
              (settings) => {
                const amount = callback_data.params as number;
                settings.amount = amount;
                return settings;
              },
            );
            break;
          case KeyCallbackData.DEPOSIT_ENTER_AMOUNT:
            this.requestEnterDepositAmount(
              ctx,
              message.chat.id,
              message.message_id,
            );
            break;
          case KeyCallbackData.DEPOSIT_CONFIRM:
            this.requestDepositConfirm(
              ctx,
              message.chat.id,
              message.message_id,
            );
            break;
          case KeyCallbackData.WITHDRAW:
            this.showWithdrawMenu(ctx, callback_data.params);
            break;
          case KeyCallbackData.WITHDRAW_RELAYER:
            this.changeWithdrawParams(
              ctx,
              message.chat.id,
              message.message_id,
              (settings) => {
                const relayer = callback_data.params as boolean;
                settings.relayer = relayer;
                return settings;
              },
            );
            break;
          case KeyCallbackData.WITHDRAW_ENTER_SECRET_KEY:
            this.requestEnterWithdrawSecretKey(
              ctx,
              message.chat.id,
              message.message_id,
            );
            break;
          case KeyCallbackData.WITHDRAW_ENTER_RECIPIENT:
            this.requestEnterWithdrawRecipient(
              ctx,
              message.chat.id,
              message.message_id,
            );
            break;
          case KeyCallbackData.WITHDRAW_CONFIRM:
            this.requestWithdrawConfirm(
              ctx,
              message.chat.id,
              message.message_id,
            );
            break;
          case KeyCallbackData.SWAP:
            this.showSwapMenu(ctx, callback_data.params);
            break;
          case KeyCallbackData.SWAP_SLIPPAGE_OPTION:
            this.changeSwapParams(
              ctx,
              message.chat.id,
              message.message_id,
              (settings) => {
                const slippage = callback_data.params as number;
                settings.slippage = slippage;
                return settings;
              },
            );
            break;
          case KeyCallbackData.SWAP_RELAYER:
            this.changeSwapParams(
              ctx,
              message.chat.id,
              message.message_id,
              (settings) => {
                const relayer = callback_data.params as boolean;
                settings.relayer = relayer;
                return settings;
              },
            );
            break;
          case KeyCallbackData.SWAP_ENTER_SECRET_KEY:
            this.requestEnterSwapSecretKey(
              ctx,
              message.chat.id,
              message.message_id,
            );
            break;
          case KeyCallbackData.SWAP_ENTER_TOKEN:
            this.requestEnterSwapToken(
              ctx,
              message.chat.id,
              message.message_id,
            );
            break;
          case KeyCallbackData.SWAP_ENTER_RECIPIENT:
            this.requestEnterSwapRecipient(
              ctx,
              message.chat.id,
              message.message_id,
            );
            break;
          case KeyCallbackData.SWAP_ENTER_SLIPPAGE:
            this.requestEnterSwapSlippage(
              ctx,
              message.chat.id,
              message.message_id,
            );
            break;
          case KeyCallbackData.SWAP_CONFIRM:
            this.requestSwapConfirm(ctx, message.chat.id, message.message_id);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  /// END: ========================== CALLBACK ==========================

  /// BEGIN: ========================== MESSAGE ==========================
  @On('message')
  async onMessage(@Ctx() ctx, @Message() message) {
    try {
      let status: JobStatus;

      const telegramId = message.from.id;

      const job = await this.jobService.getLastJob(telegramId);

      const timestamp = new Date().getTime();

      if (
        job.status == JobStatus.inProcess &&
        job.timestamp + 1 * 60 * 1000 > timestamp /// only validate in a minute
      ) {
        switch (job.action) {
          case JobAction.RESGITER:
            status = await this.onRegister(ctx, message, job);
            break;
          case JobAction.ENTER_PK_FOR_IMPORT_W:
            status = await this.onEnterPKForImportW(ctx, message, job);
            break;
          case JobAction.ENTER_PW_FOR_IMPORT_W:
            status = await this.onEnterPWForImportW(ctx, message, job);
            break;
          case JobAction.ENTER_PK_FOR_REPLACE_W:
            status = await this.onEnterPKForReplaceW(ctx, message, job);
            break;
          case JobAction.ENTER_PW_FOR_REPLACE_W:
            status = await this.onEnterPWForReplaceW(ctx, message, job);
            break;
          case JobAction.ENTER_PW_FOR_CHANGE_PW:
            status = await this.onChangePW(ctx, message, job);
            break;
          case JobAction.ENTER_PW_FOR_CHANGE_PW:
            status = await this.onEnterPWChangePW(ctx, message, job);
            break;
          case JobAction.ENTER_PW_FOR_SHOW_PK:
            status = await this.onEnterPWShowWalletWithPK(ctx, message, job);
            break;
          case JobAction.ENTER_DEPOSIT_AMOUNT:
            status = await this.onEnterDepositAmount(ctx, message, job);
            break;
          case JobAction.ENTER_PW_FOR_DEPOSIT:
            status = await this.onEnterPWForDeposit(ctx, message, job);
            break;
          case JobAction.ENTER_WITHDRAW_SECRET_KEY:
            status = await this.onEnterWithdrawSecretKey(ctx, message, job);
            break;
          case JobAction.ENTER_WITHDRAW_RECIPIENT:
            status = await this.onEnterWithdrawRecipient(ctx, message, job);
            break;
          case JobAction.ENTER_PW_FOR_WITHDRAW:
            status = await this.onEnterPWForWithdraw(ctx, message, job);
            break;
          case JobAction.ENTER_SWAP_SECRET_KEY:
            status = await this.onEnterSwapSecretKey(ctx, message, job);
            break;
          case JobAction.ENTER_SWAP_TOKEN:
            status = await this.onEnterSwapToken(ctx, message, job);
            break;
          case JobAction.ENTER_SWAP_RECIPIENT:
            status = await this.onEnterSwapRecipient(ctx, message, job);
            break;
          case JobAction.ENTER_SWAP_SLIPPAGE:
            status = await this.onEnterSwapSlippage(ctx, message, job);
            break;
          case JobAction.ENTER_PW_FOR_SWAP:
            status = await this.onEnterPWForSwap(ctx, message, job);
            break;
          default:
            break;
        }

        if (status) {
          this.jobService.updateStatus(
            new UpdateJobStatusDto(job._id.toString(), status, telegramId),
          );
        }
      } else {
        this.searchToken(ctx, message);
      }
    } catch (error) {
      console.log('============ ON MESSAGE ERROR ===========', error);
    }
  }
  /// END: ========================== MESSAGE ==========================

  async welcome(@Ctx() ctx, telegramId: string) {
    try {
      const user = await this.userService.get(telegramId);
      if (!!user) {
        this.showMainMenu(ctx, telegramId);
      } else {
        this.showRegisterMenu(ctx, telegramId);
      }
    } catch (error) {
      console.log('ON START ERROR', error);
    }
  }
}
