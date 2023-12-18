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
    @InjectModel(Larksuite.name) private larksuiteModel: Model<Larksuite>,
  ) {
    this.larkClient = new lark.Client({
      appId: process.env.APP_ID,
      appSecret: process.env.APP_SECRET,
      appType: lark.AppType.SelfBuild,
      domain: lark.Domain.Feishu,
    });
  }

  private readonly larkClient: lark.Client;

  async createNewRecord(record_id) {
    // const client = new lark.Client({
    //   appId: 'app id',
    //   appSecret: 'app secret',
    //   disableTokenCache: true
    // });

    try {
      const res = await this.larkClient.bitable.appTableRecord.get({
        path: {
          app_token: 'W3k8bXMvna0piHsvykXuZlHEsZC',
          table_id: 'tblJyo1vi6MZ1gGe',
          record_id,
        },
      },
        // lark.withTenantToken("tenant_access_toekn")
      )
      console.log('res', res)
      if (res && res.code == 0) {
        await this.larksuiteModel.create(res['data']['record'])
      } else {
        throw ('Request failed!!')
      }
      return { result: 1 };
    } catch (error) {
      return { result: 0, err: error }
    }
  }

  async updateRecord(record_id) {
    try {
      const record = await this.larksuiteModel.findOne({ record_id })
      if (!record) throw ('No record!!')
      const res = await this.larkClient.bitable.appTableRecord.get({
        path: {
          app_token: 'W3k8bXMvna0piHsvykXuZlHEsZC',
          table_id: 'tblJyo1vi6MZ1gGe',
          record_id,
        },
      })
      if (res && res.code == 0) {
        record.fields = res.data.record.fields;
        await record.save()
      } else {
        throw ('Request failed!!')
      }
      return { result: 1 }
    } catch (error) {
      return { result: 0, err: error }
    }
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
