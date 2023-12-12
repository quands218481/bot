import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ChainId } from 'src/constants/chain-list';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true })
  telegramId: string;

  @Prop({ required: true })
  wallets: Array<string>;

  @Prop({ required: true })
  privateKeys: Array<string>;

  @Prop({ required: true, default: ChainId.Ethereum })
  chainId: ChainId;

  @Prop({ required: true })
  password: string;

  @Prop({ default: new Date().getTime() })
  timestamp: number;

  @Prop({ default: true })
  status: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
