import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';

@Schema({ timestamps: true })
export class User extends Document {

  @Prop({
    required: false,
  })
  DVCS_ID: string;

  @Prop({
    required: false,
  })
  LOAI_DT: string

  @Prop({
    required: false,
  })
  MS_THUE: string

  @Prop({
    required: false,
  })
  MA_DT: string

  @Prop({
    required: false,
  })
  TEN_DT: string

  @Prop({
    required: false,
  })
  MA_NH_DT: string

  @Prop({
    required: false,
  })
  GHI_CHU: string

  @Prop({
    // required: true
  })
  createdAt?: Date

  @Prop({
    // required: true
  })
  updatedAt?: Date

}

export const UserSchema = createSchemaForClassWithMethods(User);
