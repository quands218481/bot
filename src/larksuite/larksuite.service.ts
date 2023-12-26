import { Injectable, Logger } from '@nestjs/common';
import * as lark from '@larksuiteoapi/node-sdk';
import { ConfigService } from '@nestjs/config';
import { Watch } from './watch.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Table } from './table.schema';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as https from "https";
import axios from 'axios';
import { randomInt } from 'crypto';
// import * as FormData from 'form-data';
// import { Duplex } from 'stream';

@Injectable()
export class LarkSuiteService {
  private readonly larkClient: lark.Client;
  private httpsAgent: https.Agent;
  constructor(private readonly configService: ConfigService,
    private readonly http: HttpService,
    @InjectModel(Watch.name) private watchModel: Model<Watch>,
    @InjectModel(Table.name) private tableModel: Model<Table>,
  ) {
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    this.larkClient = new lark.Client({
      appId: process.env.APP_ID,
      appSecret: process.env.APP_SECRET,
      appType: lark.AppType.SelfBuild,
      domain: lark.Domain.Feishu,
    });
  }


  async cronWithdrawTable() {
    try {
      const watch  = await this.watchModel.findOne();
      let lastCronTime = 0;
      if (watch) {
        lastCronTime = Date.now()-3600*1000
        watch.lastCronTime = lastCronTime;
        await watch.save()
      }
      const table_id = process.env.WITHDRAW_TABLEID;
      const app_token = process.env.WITHDRAW_APP_TOKEN;
      const newRecords = await this.getNewRecords("", table_id, app_token, lastCronTime);
      if (!newRecords || !newRecords[0]) {
        throw ('No new record!!')
      }
      // const editedRecords = await this.getEditedRecords("", table_id, app_token, watch.lastModified, watch.now);
      const tableInDB = await this.tableModel.findOne({ table_id })
      if (!tableInDB) {
        const res = await this.larkClient.bitable.appTable.list({
          path: {
            app_token
          }
        });
        if (res && res.code == 0) {
          const table = res.data.items.find((t) => t.table_id == table_id)
          const validatedRecords = newRecords.map((a) => {
            return { ...a.fields, record_id: a.record_id }
          })
          const newData = this.mapTopupFieldFromLarkToVacom(validatedRecords)
          const loginRes = await axios.post('https://0108768622.vaonline.vn/api/Account/Login',
            {
              "username": "BOT",
              "pass": "Thehuman@2023",
              "dvcs": "VP"
            }, {
            httpsAgent: this.httpsAgent,
          });
          const token = loginRes.data.token
          const vacom = await axios.post('https://0108768622.vaonline.vn/api/System/Save',
            {
              "windowid": "WIN0052",
              "editmode": 1,
              "data": newData
            },
            {
              httpsAgent: this.httpsAgent,
              headers: {
                'Authorization': `Bear ${token};VP;2023;vi`,
                'content-type': 'application/json'
              }
            })
          console.log(vacom)
          await this.tableModel.create({ ...table, records: newRecords })
        } else {
          throw ('Request failed')
        }
      } else {
        // if (editedRecords.length && editedRecords[0]) {
        //   editedRecords.forEach((record) => {
        //     tableInDB.records.forEach((r) => {
        //       if (r.record_id == record.record_id) {
        //         r = record
        //       }
        //     })
        //   })
        // }
        tableInDB.records = tableInDB.records.concat(newRecords)
        await tableInDB.save()
      }
    } catch (error) {
      console.log(error)
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async cronTopUpTable() {
    try {
      const watch  = await this.watchModel.findOne();
      let lastCronTime = 0;
      if (watch) {
        lastCronTime = Date.now()-3600*1000
        watch.lastCronTime = lastCronTime;
        await watch.save()
      } else {
        await this.watchModel.create({lastCronTime, now: Date.now()})
      }
      console.log(lastCronTime)
      const table_id = process.env.TOPUP_TABLEID;
      const app_token = process.env.TOPUP_APP_TOKEN;
      const newRecords = await this.getNewRecords("", table_id, app_token, lastCronTime);
      console.log(newRecords)
      if (!newRecords || !newRecords[0]) {
        throw ('No new record!!')
      }
      // const editedRecords = await this.getEditedRecords("", table_id, app_token, watch.lastModified, watch.now);
      const tableInDB = await this.tableModel.findOne({ table_id })
      if (!tableInDB) {
        const res = await this.larkClient.bitable.appTable.list({
          path: {
            app_token
          }
        });
        if (res && res.code == 0) {
          const table = res.data.items.find((t) => t.table_id == table_id)
          const validatedRecords = newRecords.map((a) => {
            return { ...a.fields, record_id: a.record_id }
          })
          const newData = this.mapTopupFieldFromLarkToVacom(validatedRecords)
          const loginRes = await axios.post('https://0108768622.vaonline.vn/api/Account/Login',
            {
              "username": "BOT",
              "pass": "Thehuman@2023",
              "dvcs": "VP"
            }, {
            httpsAgent: this.httpsAgent,
          });
          const token = loginRes.data.token
          const vacom = await axios.post('https://0108768622.vaonline.vn/api/System/Save',
            {
              "windowid": "WIN00049",
              "editmode": 1,
              "data": [newData[0]]
            },
            {
              httpsAgent: this.httpsAgent,
              headers: {
                'Authorization': `Bear ${token};VP;2023;vi`,
                'content-type': 'application/json'
              }
            })
          console.log(vacom)
          await this.tableModel.create({ ...table, records: newRecords })
        } else {
          throw ('Request failed')
        }
      } else {
        // if (editedRecords.length && editedRecords[0]) {
        //   editedRecords.forEach((record) => {
        //     tableInDB.records.forEach((r) => {
        //       if (r.record_id == record.record_id) {
        //         r = record
        //       }
        //     })
        //   })
        // }
        tableInDB.records = tableInDB.records.concat(newRecords)
        await tableInDB.save()
      }
    } catch (error) {
      console.log(error)
    }
  }

  async getEditedRecords(page_token, table_id, app_token, lastModified, now) {
    try {
      let res;
      let items = [];
      if (!page_token) {
        res = await this.larkClient.bitable.appTableRecord.list({
          path: {
            app_token,
            table_id,
          },
          params: {
            page_size: 499,
            filter: `AND(currentValue.[Modified Time] >= ${lastModified}, currentValue.[Created Time] <= ${lastModified})`
          }
        })
      } else {
        res = await this.larkClient.bitable.appTableRecord.list({
          path: {
            app_token,
            table_id,
          },
          params: {
            page_size: 499,
            page_token,
            filter: `AND(currentValue.[Modified Time] >= ${lastModified}, currentValue.[Created Time] <= ${lastModified})`
          }
        })
      }
      if (res && res.code == 0) {
        items = items.concat(res.data.items)
        if (!res.data.has_more) {
          return items
        } else {
          return items.concat(await this.getEditedRecords(res.data.page_token, table_id, app_token, lastModified, now))
        }
      } else {
        throw ('Request failed!!')
      }
    } catch (error) {
      return []
    }
  }

  // áp dụng đệ quy để xử lý hết các case
  async getNewRecords(page_token, table_id, app_token, lastCronTime) {
    try {
      // const { yesterday } = await this.watchModel.findOne({})
      let res;
      let items = [];
      if (!page_token) {
        res = await this.larkClient.bitable.appTableRecord.list({
          path: {
            app_token,
            table_id,
          },
          params: {
            page_size: 499,
            filter: `currentValue.[Created Time] >= ${lastCronTime}`
          }
        })
      } else {
        res = await this.larkClient.bitable.appTableRecord.list({
          path: {
            app_token,
            table_id,
          },
          params: {
            page_size: 499,
            page_token,
            filter: `currentValue.[Created Time] >=${lastCronTime}`
          }
        })
      }
      if (res && res.code == 0) {
        items = items.concat(res.data.items)
        if (!res.data.has_more) {
          return items
        } else {
          return items.concat(await this.getNewRecords(res.data.page_token, table_id, app_token, lastCronTime))
        }
      } else {
        throw ('Request failed!!')
      }
    } catch (error) {
      return []
    }
  }

  mapTopupFieldFromLarkToVacom(data: []) {
    const newData = data.map((datum) => {
      const newDatum = {};
      newDatum['NAM'] = datum['Year'];
      newDatum['TEN_DT0'] = datum['Clientaccount'];
      newDatum['MA_DT0'] = datum['Ewallet'];
      newDatum['DIA_CHI'] = datum['Clientaccount'];
      newDatum['DVCS_ID'] = 'VP';
      newDatum['T_TIEN'] = datum['AmountVND(auto)']
      newDatum['MA_CT'] = "PNH";
      newDatum['NHOM_CT'] = "1";
      newDatum["SO_CT"] = `PNK/${datum["record_id"]}`
      newDatum["DIEN_GIAI"] = datum["TransactionID(auto)"]
      newDatum["SO_PX"] = datum["TransactionID(auto)"]
      newDatum["MA_NT"] = datum["USD"]
      newDatum["T_TCK"] = 0;
      newDatum["NGAY_CT"] = new Date(datum["Created"]).toLocaleDateString('vn-VN')
      newDatum['details'] = [
        {
          "TAB_ID": "TAB00082",
          "TAB_TABLE": "CTHV",
          "data": [
            {
              "MA_HV": "MA_HV"
            }
          ]

        },
        {

          "TAB_ID": "TAB00083",
          "TAB_TABLE": "PSTHUE",
          "data": []
        },
        {

          "TAB_ID": "TAB00084",
          "TAB_TABLE": "PSCF",
          "data": []

        }
      ]
      return newDatum;
    })
    return newData;
  }
}