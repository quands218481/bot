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
import { Record, TYPE } from './records.schema';
import { createWorker } from 'tesseract.js';
import * as cheerio from 'cheerio';
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
    @InjectModel(Record.name) private recordModel: Model<Record>,
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




  // @Cron(CronExpression.EVERY_30_MINUTES_BETWEEN_9AM_AND_6PM)
  async sendRecordsToVacom() {
    const WDdata = await this.recordModel.find({ isPushed: false, type: TYPE.WITHDRAW })
    const savedWDData = this.mapWithdrawFieldFromLarkToVacom(WDdata.map((datum) => {
      return { ...datum.fields, record_id: datum.record_id }
    }))
    const loginRes = await axios.post('https://0108768622.vaonline.vn/api/Account/Login',
      {
        "username": "BOT",
        "pass": "Thehuman@2023",
        "dvcs": "VP"
      }, {
      httpsAgent: this.httpsAgent,
    });
    const token = loginRes.data.token
    await axios.post('https://0108768622.vaonline.vn/api/System/Save',
      {
        "windowid": "WIN00052",
        "editmode": 1,
        "data": savedWDData
      },
      {
        httpsAgent: this.httpsAgent,
        headers: {
          'Authorization': `Bear ${token};VP;2023;vi`,
          'content-type': 'application/json'
        }
      })
    const WDids = WDdata.map((datum) => datum.id)
    await this.recordModel.updateMany({ id: { $in: WDids } }, { $set: { isPushed: true } })
    const data = await this.recordModel.find({ isPushed: false, type: TYPE.TOPUP })
    const savedData = this.mapTopupFieldFromLarkToVacom(data.map((datum) => {
      return { ...datum.fields, record_id: datum.record_id }
    }))
    await axios.post('https://0108768622.vaonline.vn/api/System/Save',
      {
        "windowid": "WIN00049",
        "editmode": 1,
        "data": savedData
      },
      {
        httpsAgent: this.httpsAgent,
        headers: {
          'Authorization': `Bear ${token};VP;2023;vi`,
          'content-type': 'application/json'
        }
      })
    const ids = data.map((datum) => datum.id)
    await this.recordModel.updateMany({ id: { $in: ids } }, { $set: { isPushed: true } })

  }

  // @Cron(CronExpression.EVERY_10_MINUTES)
  async cronLarkRecord() {
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
      const topupRecords = await this.getNewRecords("", process.env.TOPUP_TABLEID, process.env.TOPUP_APP_TOKEN, lastCronTime);

      const withdrawRecords = await this.getNewRecords("", process.env.WITHDRAW_TABLEID, process.env.WITHDRAW_APP_TOKEN, lastCronTime);
      if (topupRecords && topupRecords[0]) {
        const savedTopupData = topupRecords.filter((record) => {
          return (record.fields["customer_code"] && record["fields"]["MA_NG"])
        }).map((element) => {
          return { ...element, isPushed: false, type: TYPE.TOPUP }
        })
        await this.recordModel.insertMany(savedTopupData)
      }
      if (withdrawRecords && withdrawRecords[0]) {
        const savedWithdrawData = withdrawRecords.filter((record) => {
          return (record["fields"]["rate"] && record["fields"]["Client"] && record["fields"]["MA_NG"])
        }).map((element) => {
          return { ...element, isPushed: false, type: TYPE.WITHDRAW }
        })
        await this.recordModel.insertMany(savedWithdrawData)
      }
    } catch (error) {
      throw(error)
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

  mapWithdrawFieldFromLarkToVacom(data: object[]) {
    const newData = data.map((datum) => {
      const newDatum = {};
      const obj1 = {}
      if (datum["rate"][0] < 25000) obj1["DVT_CB"] = "USD"
      else obj1["DVT_CB"] = "EUR"
      obj1["LOAI_XB"] = "1"
      obj1["TK_CO2"] = "51113" && (datum["TK_DTHU"] && datum["TK_DTHU"][0] && datum["TK_DTHU"][0].toString())
      obj1["TK_NO"] = "131" && (datum["TK_GV"] && datum["TK_GV"][0] && datum["TK_GV"][0].toString())
      obj1["TK_GV"] = "131" && (datum["TK_GV"] && datum["TK_GV"][0] && datum["TK_GV"][0].toString())
      obj1["TK_CO"] = "1561"
      obj1["TK_NO2"] = "131"
      obj1["TEN_HV"] = "TENHV" && (datum["MA_NHOM"] && datum["MA_NHOM"][0] && datum["MA_NHOM"][0]["text"])
      obj1["MA_HV"] = "MAHV" && (datum["MA_HV"] && datum["MA_HV"][0] && datum["MA_HV"][0]["text"])
      obj1["MA_KHO"] = "MAKHO" && (datum["MA_KHO"] && datum["MA_KHO"][0]&& datum["MA_KHO"][0]["text"])
      obj1["MA_NG"] = "MA_NG" && (datum["MA_NG"] && datum["MA_NG"][0] &&  datum["MA_NG"][0]["text"])
      obj1["MA_NG_DC"] = "MA_NG" && (datum["MA_NG"] && datum["MA_NG"][0] &&  datum["MA_NG"][0]["text"])
      obj1["GIA2"] = 24000 && (datum["rate"] && datum["rate"][0])
      obj1["SO_LUONG"] = 1000 && (datum["quatity"] && datum["quatity"][0])
      obj1["TIEN2"] = obj1["GIA2"] * obj1["SO_LUONG"]
      const obj2 = {}
      if (obj1["GIA2"] < 25000) obj2["DVT_CB"] = "USD"
      else obj2["DVT_CB"] = "EUR"
      obj2["LOAI_XB"] = "2"
      obj2["TK_CO2"] = "51113" && (datum["TK_DTHU"] && datum["TK_DTHU"][0] && datum["TK_DTHU"][0].toString())
      obj2["TK_NO"] = "131" && (datum["TK_GV"] && datum["TK_GV"][0] && datum["TK_GV"][0].toString())
      obj2["TK_GV"] = "131" && (datum["TK_GV"] && datum["TK_GV"][0] && datum["TK_GV"][0].toString())
      obj2["TK_CO"] = "1561"
      obj2["TK_NO2"] = "131"
      obj2["TEN_HV"] = "TENHV" && (datum["MA_NHOM"] && datum["MA_NHOM"][0]&& datum["MA_NHOM"][0]["text"])
      obj2["MA_HV"] = "MAHV" && (datum["MA_HV"] && datum["MA_HV"][0]&& datum["MA_HV"][0]["text"])
      obj2["MA_KHO"] = "MAKHO" && (datum["MA_KHO"] && datum["MA_KHO"][0]&& datum["MA_KHO"][0]["text"])
      obj2["MA_NG_DC"] = "MA_NG" && (datum["MA_NG"] && datum["MA_NG"][0] &&  datum["MA_NG"][0]["text"])
      obj2["GIA2"] = 24000 && (datum["rate"] && datum["rate"][0])
      obj2["SO_LUONG"] = 1000 && (datum["quatity"] && datum["quatity"][0] * 0.05)
      obj2["TIEN2"] = obj2["GIA2"] * obj2["SO_LUONG"] * 0.05
      newDatum["MA_NT"] = "VND"
      newDatum["TY_GIA"] = 1
      newDatum['NAM'] = datum['Year'];
      newDatum['TEN_DT0'] = "TENDTO" && (datum['Client'] && datum['Client'][0] && datum['Client'][0]["text"]);
      newDatum['MA_DT0'] = "VA0001";
      newDatum['DVCS_ID'] = 'VP';
      newDatum["T_SL"] = obj2["SO_LUONG"]
      newDatum["T_TIEN_HANG"] = obj2["GIA2"] * obj2["SO_LUONG"]
      newDatum["T_TIEN_TT"] = obj2["GIA2"] * obj2["SO_LUONG"] * 1.05
      newDatum["T_TIEN"] = obj2["GIA2"] * obj2["SO_LUONG"] * 1.05
      newDatum['MA_CT'] = "PBH";
      newDatum['NHOM_CT'] = "2";
      newDatum["SO_CT"] = `PBH${newDatum['NAM']}-${datum["STT"]}`
      newDatum["DIEN_GIAI"] = "DIEN_GIAI" && `${newDatum["T_TIEN_TT"]} * ${obj2["GIA2"]} * ${obj2["TEN_HV"]}`
      newDatum["NGAY_CT"] = new Date(datum["Created"]).toLocaleDateString('vn-VN')
      newDatum['details'] = [
        {
          "TAB_ID": "TAB00089",
          "TAB_TABLE": "CTHV",
          "data": [
            obj1, obj2
          ]

        },
        {
          "TAB_ID": "TAB00091",
          "TAB_TABLE": "PSTHUE",
          "data": []
        },
        {

          "TAB_ID": "TAB00090",
          "TAB_TABLE": "PSCF",
          "data": []

        }
      ]
      return newDatum;
    })
    return newData;
  }

  mapTopupFieldFromLarkToVacom(data: object[]) {
    const newData = data.map((datum) => {
      const newDatum = {};
      const obj = {}
      obj["TEN_HV"] = "TENHV" && (datum["MA_NHOM"] && datum["MA_NHOM"][0]["text"])
      obj['TIEN'] = datum['AmountVND(auto)']
      obj["MA_KHO"] = "MAKHO" && (datum["MA_KHO"] && datum["MA_KHO"][0]["text"])
      obj["TK_CO"] = "3311"
      obj["TK_NO"] = "1561"
      obj["MA_HV"] = "MAHV" && (datum["MA_HV"] && datum["MA_HV"][0] && datum["MA_HV"][0]["text"])
      obj["MA_NG"] = "MA_NG" && (datum["MA_NG"] && datum["MA_NG"][0] &&  datum["MA_NG"][0]["text"])
      obj["MA_NG_DC"] = "MA_NG" && (datum["MA_NG"] && datum["MA_NG"][0] &&  datum["MA_NG"][0]["text"])
      obj["GIA"] = 24000 && (datum["rate"] && datum["rate"][0])
      obj["SO_LUONG"] = 1000 && datum["Amount(auto)"]
      if (obj["GIA"] < 25000) obj["DVT_CB"] = "USD"
      else obj["DVT_CB"] = "EUR"
      newDatum["MA_NT"] = "VND"
      newDatum["TY_GIA"] = 1
      newDatum['NAM'] = datum['Year'];
      newDatum['TEN_DT0'] = datum['Client'];
      newDatum['MA_DT0'] = "MADTO" && (datum['customer_code'] && datum['customer_code'][0] && datum['customer_code'][0]["text"]);
      newDatum['DIA_CHI'] = datum['Clientaccount'];
      newDatum['DVCS_ID'] = 'VP';
      newDatum['T_TIEN'] = datum['AmountVND(auto)']
      newDatum['MA_CT'] = "PNH";
      newDatum['NHOM_CT'] = "1";
      newDatum["SO_CT"] = `PNK${newDatum['NAM']}-${datum["STT"]}`
      newDatum["DIEN_GIAI"] = "DIEN_GIAI" && `${obj["SO_LUONG"]} * ${obj["GIA"]} * ${obj["TEN_HV"]}`
      newDatum["SO_PX"] = datum["TransactionID(auto)"]
      newDatum["T_TCK"] = 0;
      newDatum["NGAY_CT"] = new Date(datum["Created"]).toLocaleDateString('vn-VN')
      newDatum['details'] = [
        {
          "TAB_ID": "TAB00082",
          "TAB_TABLE": "CTHV",
          "data": [
            obj
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
      await this.larkClient.bitable.appTableRecord.batchCreate({
        path: { app_token, table_id }, data: { records: data }
      })
      return 1;
    } catch (error) {
      throw error
    }
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

  async calculateWithdrawFee(data: object[]) {
    const validateRecords = data.filter((datum) => {
      return (datum["fields"]["image"] && datum["fields"]["image"][0] && datum["fields"]["image"][0]["text"])
    })
    const array = validateRecords.map((v) => {
      return this.extractImageUrl(v["fields"]["image"][0]["text"])
        .then((d) => {
          return { ...v, data: d }
        })
    })

    const res = await Promise.all(array)
    const worker = await createWorker('eng');
    const promises = res.map((v) => {
      return worker.recognize(v.data)
        .then((d) => {
          return { ...v, fee: d }
        })
    })
    const result = await Promise.all(promises)
    await worker.terminate();
    return 1
  }
  async extractImageUrl(url: string): Promise<string | null> {
    try {
      const response = await this.http.get(url).toPromise();
      return this.parseHTML(response.data);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private parseHTML(html: string): string | null {
    const $ = cheerio.load(html);
    const rows = $('.screenshot-image');
    if (rows.length > 0 && rows[0].attribs && rows[0].attribs.src) {
      return rows[0].attribs.src;
    }
    return null;
  }
}