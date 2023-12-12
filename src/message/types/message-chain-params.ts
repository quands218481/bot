import { ChainId } from 'src/constants/chain-list';

export class MessageChainParams {
  chainId: ChainId;

  constructor(chainId: ChainId) {
    this.chainId = chainId;
  }

  toJSON(): string {
    return JSON.stringify({
      chainId: this.chainId,
    });
  }

  static fromJSON(json: string): MessageChainParams {
    const { chainId } = JSON.parse(json);
    return new MessageChainParams(chainId);
  }
}
