import { Module } from '@nestjs/common';
import { LarkSuiteService } from './larksuite.service';
import { ConfigModule } from '@nestjs/config';
import { LarkSuiteController } from './larksuite.controller';

@Module({
  imports: [ConfigModule],
  providers: [LarkSuiteService],
  controllers: [LarkSuiteController],
  exports: [LarkSuiteService],
})
export class LarkSuiteModule {}
