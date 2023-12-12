import { Module } from '@nestjs/common';
import { ZeroxAnonBotUpdate } from './0xanonbot.update';
import { UsersModule } from 'src/users/users.module';
import { JobsModule } from 'src/jobs/jobs.module';
import { MessagesModule } from 'src/message/messages.module';
import { Zero0AnonService } from './0xanonbot.service';

@Module({
  imports: [UsersModule, JobsModule, MessagesModule],
  providers: [ZeroxAnonBotUpdate, Zero0AnonService],
})
export class ZeroxAnonBotModule {}
