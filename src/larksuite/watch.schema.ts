import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';


@Schema({ timestamps: true })
export class Watch extends Document {

  @Prop({
    required: true,
  })
  now: Number;

  @Prop({
    required: true,
  })
  lastModified: Number

  @Prop({
    // required: true
  })
  createdAt?: Date

  @Prop({
    // required: true
  })
  updatedAt?: Date

}

export const WatchSchema = createSchemaForClassWithMethods(Watch);
