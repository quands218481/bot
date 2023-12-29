import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../create-schema';


export enum TYPE {
    TOPUP = "topup",
    WITHDRAW = "withdraw"
}
@Schema({ timestamps: true })
export class Record extends Document {
    @Prop({
        required: true,
        default: true
    })
    isPushed: boolean

    @Prop({
        required: true,
        default: TYPE.TOPUP,
    })
    type: string

    @Prop({
        required: true,
        type: Object
    })
    fields: object

    @Prop({
        required: false,
    })
    order: number

    @Prop({
        required: false,
    })
    record_id: string

    @Prop({
        required: false,
    })
    id: string
}

export const RecordSchema = createSchemaForClassWithMethods(Record);
