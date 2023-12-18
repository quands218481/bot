import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {createSchemaForClassWithMethods} from '../create-schema';


@Schema()
export class Larksuite extends Document {


  @Prop({
    required: true,
  })
  token: string;

  @Prop({
    required: true,
  })
  rate: number;

  @Prop({
    required: true,
  })
  profit: number;

  @Prop({
    required: true,
  })
  flag: number;
}

export const LarkSuiteSchema = createSchemaForClassWithMethods(Larksuite);
