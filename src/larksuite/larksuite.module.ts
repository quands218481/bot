import { Module } from '@nestjs/common';
import { LarkSuiteService } from './larksuite.service';
import { ConfigModule } from '@nestjs/config';
import { LarkSuiteController } from './larksuite.controller';
import { WatchSchema, Watch } from './watch.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Table, TableSchema } from './table.schema';
import { HttpModule } from '@nestjs/axios';
import { User, UserSchema } from './user.schema';

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
        {
          name: User.name,
          schema: UserSchema,
        },
      ])
  ],
  providers: [LarkSuiteService],
  controllers: [LarkSuiteController],
  exports: [LarkSuiteService],
})
export class LarkSuiteModule {}
