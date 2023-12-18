import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {createSchemaForClassWithMethods} from '../create-schema';


@Schema()
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
}

export const LarkSuiteSchema = createSchemaForClassWithMethods(Larksuite);
