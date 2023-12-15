import { Injectable, Logger } from '@nestjs/common';
import * as lark from '@larksuiteoapi/node-sdk';
import { ConfigService } from '@nestjs/config';
// import * as FormData from 'form-data';
// import { Duplex } from 'stream';

@Injectable()
export class LarkSuiteService {
  constructor(private readonly configService: ConfigService) {
    this.larkClient = new lark.Client({
      appId: 'cli_a5f17ef44a78d009',
      appSecret: 'RAy8RWhtzBeIOz8VNApGahZruHZaN0Fe',
      appType: lark.AppType.SelfBuild,
      domain: lark.Domain.Feishu,
    });
  }

  private readonly logger = new Logger('LarkSuiteService');

  private readonly larkClient: lark.Client;

  async create(){
    return 1
  }
  
  async getAppInfo() {
    const token = await this.larkClient.auth.appAccessToken.internal({
      data: {
        app_id: 'cli_a5f17ef44a78d009',
        app_secret: 'RAy8RWhtzBeIOz8VNApGahZruHZaN0Fe',
      },
    });
    console.log(token['tenant_access_token'])
  this.larkClient.bitable.appTableRecord.list({
    path: {
      app_token: 'Gbp3b4Ow3acvOmsG8gjuFcDxsvb',
      table_id: 'tblmYjnzYNv07o3p'
    },
  }, lark.withTenantToken(token['tenant_access_token'])
  ).then(res => {
    console.log(res)
  }).catch(e => e);
  return;
    }
     
  // async uploadFile(
  //   fileName: string,
  //   file: Express.Multer.File,
  // ): Promise<{ fileTokn: string }> {
  //   try {
  //     const token = await this.larkClient.auth.appAccessToken.internal({
  //       data: {
  //         app_id: this.configService.get('lark.appId'),
  //         app_secret: this.configService.get('lark.secret'),
  //       },
  //     });
  //     if (token && token['tenant_access_token']) {
  //       const fixFormData = new FormData();
  //       const stream = new Duplex();
  //       stream.push(file.buffer);
  //       fixFormData.append('file', file.buffer);
  //       const fileToken = await this.larkClient.drive.file.uploadAll(
  //         {
  //           data: {
  //             file_name: fileName ?? file.fieldname,
  //             parent_node: this.configService.get('lark.folderToken'),
  //             parent_type: 'explorer',
  //             size: file.size,
  //             file: ReadStream.from(stream.iterator()).read(),
  //           },
  //         },
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token['tenant_access_token']}`,
  //             ...fixFormData.getHeaders(),
  //           },
  //         },
  //       );
  //       if (fileToken['file_token']) {
  //         return {
  //           fileToken: fileToken['file-token'],
  //         };
  //       }
  //     }
  //   } catch (error) {
  //     this.logger.error('GOOGLE UPLOAD FILE ERROR', error);
  //   }
  // }
}
