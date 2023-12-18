import { Injectable, Logger } from '@nestjs/common';
import * as lark from '@larksuiteoapi/node-sdk';
import { ConfigService } from '@nestjs/config';
import { Larksuite } from './larksuite.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
// import * as FormData from 'form-data';
// import { Duplex } from 'stream';

@Injectable()
export class LarkSuiteService {
  constructor(private readonly configService: ConfigService,
    @InjectModel(Larksuite.name) private infoModel: Model<Larksuite>,
  ) {
    this.larkClient = new lark.Client({
      appId: 'cli_a5c27e8d76789009',
      appSecret: 'ucptiuCEFoWAGD56Hk2uMfdjS3sO3vAc',
      appType: lark.AppType.SelfBuild,
      domain: lark.Domain.Feishu,
    });
  }

  private readonly larkClient: lark.Client;
  async createRecord(record_id) {
    await this.getRecord(record_id);
    return 1
  }

  async getRecord(record_id) {
    // const client = new lark.Client({
    //   appId: 'app id',
    //   appSecret: 'app secret',
    //   disableTokenCache: true
    // });
    
    const res = await this.larkClient.bitable.appTableRecord.get({
        path: {
          app_token: 'W3k8bXMvna0piHsvykXuZlHEsZC',
          table_id: 'tblJyo1vi6MZ1gGe',
          record_id,
        },
      },
      // lark.withTenantToken("tenant_access_toekn")
    )
    console.log(res)
  return res;
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
