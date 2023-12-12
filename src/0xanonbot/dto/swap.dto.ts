export class SwapDto {
  readonly privateKey: string;
  readonly type: string;
  readonly recipient: string;
  readonly targetToken: string;
  readonly amountOutMin: string;
}
