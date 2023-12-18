import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {createSchemaForClassWithMethods} from '../create-schema';


@Schema({ timestamps: true })
export class Larksuite extends Document {
  @Prop({
    required: true,
    type: Object,
  })
  fields: object;

  @Prop({
    required: true,
  })
  id: string;

  @Prop({
    required: true,
  })
  record_id: string

  @Prop({
    // required: true
  })
  createdAt?: Date

  @Prop({
    // required: true
  })
  updatedAt?: Date

}

export const LarkSuiteSchema = createSchemaForClassWithMethods(Larksuite);
