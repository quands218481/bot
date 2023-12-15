import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
// import { ZeroxAnonBotModule } from './0xanonbot/0xanonbot.module';
import { TelegrafModule } from 'nestjs-telegraf';
// import { JobsModule } from './jobs/jobs.module';
// import { MessagesModule } from './message/messages.module';
import { LarkSuiteModule } from './larksuite/larksuite.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // MongooseModule.forRoot(<string>process.env.MONGOOSE_URL),
    // TelegrafModule.forRootAsync({
    //   useFactory: () => ({
    //     botName: <string>process.env.TELEGRAM_OXANON_BOT_NAME,
    //     token: <string>process.env.TELEGRAM_0XANON_BOT_TOKEN,
    //     include: [ZeroxAnonBotModule],
    //   }),
    // }),
    // MessagesModule,
    LarkSuiteModule,
    // ZeroxAnonBotModule,
    // JobsModule,
  ],
})
export class AppModule {}
