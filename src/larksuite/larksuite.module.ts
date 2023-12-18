import { Module } from '@nestjs/common';
import { LarkSuiteService } from './larksuite.service';
import { ConfigModule } from '@nestjs/config';
import { LarkSuiteController } from './larksuite.controller';
import { LarkSuiteSchema, Larksuite } from './larksuite.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [ConfigModule,
    MongooseModule.forFeature(
      [
        {
          name: Larksuite.name,
          schema: LarkSuiteSchema,
        },])
  ],
  providers: [LarkSuiteService],
  controllers: [LarkSuiteController],
  exports: [LarkSuiteService],
})
export class LarkSuiteModule {}
