export class DepositDto {
  readonly publicKey: string;
  readonly privateKey: string;
  readonly txHash: string;
  readonly account: string;
  readonly amount: string;
  readonly chain: string;
}
