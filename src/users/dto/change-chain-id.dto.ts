import { ChainId } from 'src/constants/chain-list';

export class ChangeChainIdDto {
  readonly telegramId: string;
  readonly chainId: ChainId;

  constructor(telegramId: string, chainId: ChainId) {
    this.telegramId = telegramId;
    this.chainId = chainId;
  }
}
