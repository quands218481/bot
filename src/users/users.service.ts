import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schemas/user.schema';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { decryptData, encryptData, verifyPrivateKey } from 'src/app.util';
import { ChangeChainIdDto } from './dto/change-chain-id.dto';
import { ReplaceWalletDto } from './dto/replace-wallet';
import { ImportWalletDto } from './dto/import-wallet';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async create(createUser: CreateUserDto): Promise<User> {
    if (!createUser.telegramId) throw 'Telegram is invalid.';
    if (
      createUser.privateKeys.map((w) => verifyPrivateKey(w)).includes(false)
    ) {
      throw 'Wallet is invalid.';
    }
    const existUser = await this.userModel.findOne({
      telegramId: createUser.telegramId,
    });
    if (existUser) return existUser;
    const user = await this.userModel.create({
      telegramId: createUser.telegramId,
      password: await bcrypt.hash(createUser.password, await bcrypt.genSalt()),
      wallets: createUser.wallets,
      privateKeys: createUser.privateKeys.map((pk) =>
        encryptData(pk, createUser.password),
      ),
    });
    return user;
  }

  async get(telegramId: string): Promise<User> {
    const user = await this.userModel.findOne({
      telegramId: telegramId,
    });
    return user;
  }

  async importWallet(importWallet: ImportWalletDto): Promise<boolean> {
    const user = await this.userModel.findOne({
      telegramId: importWallet.telegramId,
    });
    if (!user) throw 'User not found.';
    if (!(await bcrypt.compare(importWallet.password, user.password))) {
      throw 'Wrong password.';
    }
    if (!verifyPrivateKey(importWallet.privateKey)) {
      throw 'Wallet is invalid';
    }
    if (user.wallets.filter((w) => w == importWallet.wallet).length > 0) {
      throw 'Wallet is existing';
    }

    const wallets = [...user.wallets, importWallet.wallet];
    const privateKeys = [
      ...user.privateKeys,
      encryptData(importWallet.privateKey, importWallet.password),
    ];
    const updated = await this.userModel
      .updateOne(
        {
          telegramId: importWallet.telegramId,
        },
        {
          wallets,
          privateKeys,
        },
      )
      .exec();
    return updated.modifiedCount > 0;
  }

  async replaceWallet(replaceWallet: ReplaceWalletDto): Promise<boolean> {
    const user = await this.userModel.findOne({
      telegramId: replaceWallet.telegramId,
    });
    if (!user) throw 'User not found.';
    if (!(await bcrypt.compare(replaceWallet.password, user.password))) {
      throw 'Wrong password.';
    }
    if (!verifyPrivateKey(replaceWallet.privateKey)) {
      throw 'Wallet is invalid';
    }
    if (user.wallets.filter((w) => w == replaceWallet.wallet).length > 0) {
      throw 'Wallet is existing';
    }
    const wallets = user.wallets.map((w, index) => {
      if (index == replaceWallet.index) return replaceWallet.wallet;
      return w;
    });
    const privateKeys = user.privateKeys.map((pk, index) => {
      if (index == replaceWallet.index) {
        return encryptData(replaceWallet.privateKey, replaceWallet.password);
      }
      return pk;
    });
    const updated = await this.userModel
      .updateOne(
        {
          telegramId: replaceWallet.telegramId,
        },
        {
          wallets,
          privateKeys,
        },
      )
      .exec();
    return updated.modifiedCount > 0;
  }

  async changePassword(updatePassword: ChangePasswordDto): Promise<boolean> {
    const user = await this.userModel.findOne({
      telegramId: updatePassword.telegramId,
    });
    if (!user) throw 'User not found.';
    if (!(await bcrypt.compare(updatePassword.oldPassword, user.password))) {
      throw 'Wrong password.';
    }
    const hashedPassword = await bcrypt.hash(
      updatePassword.password,
      await bcrypt.genSalt(),
    );
    const updateData = {
      password: hashedPassword,
      wallets: user.privateKeys.map((pk) =>
        encryptData(
          decryptData(pk, updatePassword.oldPassword),
          updatePassword.password,
        ),
      ),
    };

    const updated = await this.userModel
      .updateOne(
        {
          telegramId: updatePassword.telegramId,
        },
        updateData,
      )
      .exec();

    return updated.modifiedCount > 0;
  }

  async changeChainId(changeChainId: ChangeChainIdDto): Promise<boolean> {
    const user = await this.userModel.findOne({
      telegramId: changeChainId.telegramId,
    });
    if (!user) throw 'User not found.';
    const updated = await this.userModel
      .updateOne(
        {
          telegramId: changeChainId.telegramId,
        },
        {
          chainId: changeChainId.chainId,
        },
      )
      .exec();

    return updated.modifiedCount > 0;
  }

  async verifyPassword(telegramId: string, password: string): Promise<boolean> {
    try {
      const existUser = await this.userModel.findOne({
        telegramId: telegramId,
      });
      if (!existUser) return false;
      return await bcrypt.compare(password, existUser.password);
    } catch (error) {
      console.log(error);
    }
  }

  async delete() {
    return this.userModel.deleteMany({});
  }

  async getAll() {
    return this.userModel.find({});
  }
}
