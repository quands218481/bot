import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getBotToken } from 'nestjs-telegraf';
import { session } from 'telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  await app.listen(process.env.PORT || 3003);
}
bootstrap();

// [{"_id":"6540791a88de79be48aba336","telegramId":"5351332067","wallets":["0x4E4f8363FBD6E0fD224bF88F0f2Cb9d08C4db535","0xfe9397b46d072B2d2C7aD69d5aD8106ac55f1B91"],"privateKeys":["1577eb18341b5b3e0f9648d348a417dee1b307ac2493af3ad1798f169acab98ce593d2f7ca72064a2ff0845ef96077d134efbc7fb217f71f83f02befb09981bea042e11fcc9837d2a10bea7d66b77773","83bc1a825a913d69e61386c89527b2b27bc5f64d12fe0818432cfd6535433de75650d12702362b6260005f4fac911f710945f35ce3318a43cecc88c729a54e2ebaa2d37683c1376196b37552fd67d285"],"chainId":1,"password":"$2b$10$ioos3t0lwZ/soJz8mp4eQO.RAqnHmkppZqenEvyFSX5elaq0mk.QW","timestamp":1698724082750,"status":true,"__v":0}]
