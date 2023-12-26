import { Module } from '@nestjs/common';
import { LarkSuiteService } from './larksuite.service';
import { ConfigModule } from '@nestjs/config';
import { LarkSuiteController } from './larksuite.controller';
import { WatchSchema, Watch } from './watch.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Table, TableSchema } from './table.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule,
    HttpModule,
    MongooseModule.forFeature(
      [
        {
          name: Watch.name,
          schema: WatchSchema,
        },
        {
          name: Table.name,
          schema: TableSchema,
        },
      ])
  ],
  providers: [LarkSuiteService],
  controllers: [LarkSuiteController],
  exports: [LarkSuiteService],
})
export class LarkSuiteModule {}
