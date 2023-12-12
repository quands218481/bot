import { MessageWithdrawParams } from 'src/message/types/message-withdraw-params';
import { MessageSwapParams } from 'src/message/types/message-swap-params';
import { MessageChainParams } from 'src/message/types/message-chain-params';
import { MessageDepositParams } from 'src/message/types/message-deposit-params';

export enum KeyCallbackData {
  NONE = 'NONE',

  ///START
  REGISTER = 'REGISTER',

  /// MAIN MENU
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  SWAP = 'SWAP',
  SETTINGS = 'SETTINGS',

  /// SETTINGS
  REPLACEW = 'REPLACEW',
  IMPORTW = 'IMPORTW',
  SHOWPKW = 'SHOWPW',
  CHANGEPW = 'CHANGEPW',

  /// OTHERS
  MAINMENU = 'MAINMENU',
  CLOSE = 'CLOSE',

  /// REPLACE WALLET
  REPLACEONW = 'REPLACEWONW',

  /// SWAP
  SWAP_SLIPPAGE_OPTION = 'SWAP_SLIPPAGE_OPTION',
  SWAP_RELAYER = 'SWAP_RELAYER',
  SWAP_ENTER_RECIPIENT = 'SWAP_ENTER_RECIPIENT',
  SWAP_ENTER_SECRET_KEY = 'SWAP_ENTER_SECRET_KEY',
  SWAP_ENTER_TOKEN = 'SWAP_ENTER_TOKEN',
  SWAP_ENTER_SLIPPAGE = 'SWAP_ENTER_SLIPPAGE',
  SWAP_CONFIRM = 'SWAP_CONFIRM',

  /// DEPOSIT
  DEPOSIT_WALLET_OPTION = 'DEPOSIT_WALLET_OPTION',
  DEPOSIT_AMOUNT_OPTION = 'DEPOSIT_AMOUNT_OPTION',
  DEPOSIT_ENTER_AMOUNT = 'DEPOSIT_ENTER_AMOUNT',
  DEPOSIT_CONFIRM = 'DEPOSIT_CONFIRM',

  /// WITHDRAW
  WITHDRAW_RELAYER = 'WITHDRAW_RELAYER',
  WITHDRAW_ENTER_RECIPIENT = 'WITHDRAW_ENTER_RECIPIENT',
  WITHDRAW_ENTER_SECRET_KEY = 'WITHDRAW_ENTER_SECRET_KEY',
  WITHDRAW_CONFIRM = 'WITHDRAW_CONFIRM',
}

export class CallbackData<T> {
  key: KeyCallbackData;
  params: T;

  constructor(key: KeyCallbackData, params: T) {
    this.key = key;
    this.params = params;
  }

  toJSON() {
    return JSON.stringify({
      key: this.key,
      params: this.params,
    });
  }

  static fromJSON<T>(json: string) {
    const { key, params } = JSON.parse(json);
    const KeyCallbackData: KeyCallbackData = key;
    return new CallbackData<T>(KeyCallbackData, params);
  }
}

export interface WParams {
  telId: string;
  index: number;
}

export interface NewSwapParamsBuilder {
  (old: MessageSwapParams): MessageSwapParams;
}

export interface NewWithdrawParamsBuilder {
  (old: MessageWithdrawParams): MessageWithdrawParams;
}

export interface NewDepositParamsBuilder {
  (old: MessageDepositParams): MessageDepositParams;
}

export interface NewChainSettingsBuilder {
  (old: MessageChainParams): MessageChainParams;
}
