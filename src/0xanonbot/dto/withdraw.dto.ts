export class WithdrawDto {
  readonly privateKey: string;
  readonly type: string;
  readonly recipient: string;
  readonly usedRelayer: boolean;
}
