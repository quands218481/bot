export class ChangePasswordDto {
  readonly telegramId: string;
  readonly oldPassword: string;
  readonly password: string;

  constructor(telegramId: string, password: string, oldPassword: string) {
    this.telegramId = telegramId;
    this.password = password;
    this.oldPassword = oldPassword;
  }
}
