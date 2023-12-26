import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {createSchemaForClassWithMethods} from '../create-schema';

@Schema({ timestamps: true })
export class Table extends Document {
  @Prop({
    required: true,
  })
  revision: number;

  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    required: true,
  })
  table_id: string

  @Prop({type: Array<any>})
  records: any[]

  @Prop({
    // required: true
  })
  createdAt?: Date

  @Prop({
    // required: true
  })
  updatedAt?: Date

}

export const TableSchema = createSchemaForClassWithMethods(Table);
