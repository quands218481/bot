export class CreatePasswordDto {
  readonly telegramId: string;
  readonly password: string;

  constructor(telegramId: string, password: string) {
    this.telegramId = telegramId;
    this.password = password;
  }
}
