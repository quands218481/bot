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
import { User } from './user.schema';
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
    @InjectModel(User.name) private userModel: Model<User>,
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


  async cronUserFromLarkToVacom() {
    try {
      const app_token = process.env.USER_APP_TOKEN
      const table_id = process.env.USER_TABLEID
      const users = await this.getUserFromLark("", table_id, app_token)
      if (!users || !users[0]) {
        throw ('No User')
      }
      const validateUsers = users.map((user) => {
        return { ...user.fields, record_id: user.record_id }
      }).filter((element) => {
        return element["customer_code"]
      })
      const newData = this.mapUserLarkToVacom(validateUsers)
      // this.userModel.insertMany(newData);
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
          "windowid": "WIN00016",
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
      // console.log(vacom.data)
      return users[0];
    } catch (error) {
      throw error
    }
  }
  async cronWithdrawTable() {
    try {
      // const watch = await this.watchModel.findOne();
      // let lastCronTime = 0;
      // if (watch) {
      //   lastCronTime = Date.now() - 3600 * 1000
      //   watch.lastCronTime = lastCronTime;
      //   await watch.save()
      // }
      // const table_id = process.env.WITHDRAW_TABLEID;
      // const app_token = process.env.WITHDRAW_APP_TOKEN;
      // const newRecords = await this.getNewRecords("", table_id, app_token, lastCronTime);
      // if (!newRecords || !newRecords[0]) {
      //   throw ('No new record!!')
      // }
      // const editedRecords = await this.getEditedRecords("", table_id, app_token, watch.lastModified, watch.now);
      // const tableInDB = await this.tableModel.findOne({ table_id })
      // if (!tableInDB) {
      //   const res = await this.larkClient.bitable.appTable.list({
      //     path: {
      //       app_token
      //     }
      //   });
      //   if (res && res.code == 0) {
      //     const table = res.data.items.find((t) => t.table_id == table_id)
      // const validatedRecords = newRecords.map((a) => {
      //   return { ...a.fields, record_id: a.record_id }
      // })
      // const newData = this.mapTopupFieldFromLarkToVacom(validatedRecords)
      const obj = {
        "DVCS_ID": "VP",
        "NAM": "2023",
        "MA_CT": "PBH",
        "NHOM_CT": "2",
        "MA_DT0": "BIDV",
        "TEN_DT0": "BIDV - Tiền gửi ( Lãi thấu chi)",
        "ONG_BA": "",
        "CT_GOC": "",
        "DIA_CHI": "HN",
        "DIEN_GIAI": "Phiếu thu tiền",
        "NGAY_CT": "2023-12-25 07:00",
        "SO_CT": "PT0001",
        "MA_NT": "VND",
        "TY_GIA": 1,
        "MA_HT": "",
        "MA_BP": "",
        "T_TIEN_TT": 100000,
        "T_THUE": 0,
        "T_TIEN": 100000,
        "T_TIEN_TT_NT": 0,
        "T_THUE_NT": 0,
        "T_TIEN_NT": 0,
        "STATUS": "1",
        "details": [
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
      }
      const loginRes = await axios.post('https://0108768622.vaonline.vn/api/Account/Login',
        {
          "username": "BOT",
          "pass": "Thehuman@2023",
          "dvcs": "VP"
        }, {
        httpsAgent: this.httpsAgent,
      });
      const token = loginRes.data.token
      console.log(token)
      const vacom = await axios.post('https://0108768622.vaonline.vn/api/System/Save',
        {
          "windowid": "WIN0052",
          "editmode": 1,
          "data": [obj]
        },
        {
          httpsAgent: this.httpsAgent,
          headers: {
            'Authorization': `Bear ${token};VP;2023;vi`,
            'content-type': 'application/json'
          }
        })
      console.log(vacom.data)
      // await this.tableModel.create({ ...table, records: newRecords })
      //   } else {
      //     throw ('Request failed')
      //   }
      // } else {
      // if (editedRecords.length && editedRecords[0]) {
      //   editedRecords.forEach((record) => {
      //     tableInDB.records.forEach((r) => {
      //       if (r.record_id == record.record_id) {
      //         r = record
      //       }
      //     })
      //   })
      // }
      // tableInDB.records = tableInDB.records.concat(newRecords)
      //   await tableInDB.save()
      // }
    } catch (error) {
      console.log(error)
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async cronTopUpTable() {
    try {
      const watch = await this.watchModel.findOne();
      let lastCronTime = 0;
      if (watch) {
        lastCronTime = Date.now() - 3600 * 1000
        watch.lastCronTime = lastCronTime;
        await watch.save()
      } else {
        await this.watchModel.create({ lastCronTime, now: Date.now() })
      }
      const table_id = process.env.TOPUP_TABLEID;
      const app_token = process.env.TOPUP_APP_TOKEN;
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
          }).filter((element) => {
            return element["customer_code"]
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
              "data": newData
            },
            {
              httpsAgent: this.httpsAgent,
              headers: {
                'Authorization': `Bear ${token};VP;2023;vi`,
                'content-type': 'application/json'
              }
            })
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

  async getUserFromLark(page_token, table_id, app_token) {
    try {
      // const app_token = process.env.USER_APP_TOKEN
      // const table_id = process.env.USER_TABLEID
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
          }
        })
      }
      if (res && res.code == 0) {
        items = items.concat(res.data.items)
        if (!res.data.has_more) {
          return items
        } else {
          return items.concat(await this.getUserFromLark(res.data.page_token, table_id, app_token))
        }
      } else {
        throw ('Request failed!!')
      }
    } catch (error) {
      return error
    }
  }

  mapWithdrawFieldFromLarkToVacom(data: []) {
    const newData = data.map((datum) => {
      const newDatum = {}
      return newDatum
    })
    return newData;
  }

  mapTopupFieldFromLarkToVacom(data: []) {
    const newData = data.map((datum) => {
      const newDatum = {};
      // newDatum["Mã hàng hoá"]
      newDatum['NAM'] = datum['Year'];
      newDatum['TEN_DT0'] = datum['Client'];
      newDatum['MA_DT0'] = datum['customer_code'][0]["text"];
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

  mapUserLarkToVacom(data: []) {
    const newData = data.map((datum) => {
      const newDatum = {};
      newDatum["DVCS_ID"] = "VP"
      newDatum["LOAI_DT"] = ""
      newDatum["MS_THUE"] = ""
      newDatum["MA_DT"] = datum["customer_code"][0]["text"]
      newDatum["TEN_DT"] = datum["customer_name"][0]["text"]
      newDatum["MA_NH_DT"] = "NCC001"
      newDatum["GHI_CHU"] = datum["record_id"]
      return newDatum;
    })
    return newData;
  }

  async addItemToLark() {
    try {
      const obj = {
        "window_id": "WIN00334",
        "start": 0,
        "count": 200,
        "continue": null,
        "filter": [],
        "infoparam": null,
        "tlbparam": []
      }
      const loginRes = await axios.post('https://0108768622.vaonline.vn/api/Account/Login',
        {
          "username": "BOT",
          "pass": "Thehuman@2023",
          "dvcs": "VP"
        }, {
        httpsAgent: this.httpsAgent,
      });
      const token = loginRes.data.token
      const vacom = await axios.post('https://0108768622.vaonline.vn/api/System/GetDataByWindowNo',
        obj,
        {
          httpsAgent: this.httpsAgent,
          headers: {
            'Authorization': `Bear ${token};VP;2023;vi`,
            'content-type': 'application/json'
          }
        })
      const data = vacom.data.data.map((datum) => {
        return {
          fields: {
            "MA_HV": datum["MA_HV"],
            "TEN_HV": datum["TEN_HV"],
            "MA_NH_HV": datum["MA_NH_HV"]
          }
        }
      })
      const table_id = "tblzKKdV95KEJxGU"
      const app_token = "PWQDbkcYbasVnVsmeNkuewIOsdH"
      console.log(data[0])
      await this.larkClient.bitable.appTableRecord.batchCreate({
        path: { app_token, table_id }, data: { records: data }
      })
      return 1;
    } catch (error) {
      throw error
    }
  }
}