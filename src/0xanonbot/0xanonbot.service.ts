import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SwapDto } from './dto/swap.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { DepositDto } from './dto/deposit';
import { SwapResponse } from './types/swap.response';
import { WithdrawResponse } from './types/withdraw.response';
import { DepositResponse } from './types/deposit.response';

@Injectable()
export class Zero0AnonService {
  _baseUrl = 'https://anonserver-177e2c88cc8a.herokuapp.com';

  get _header() {
    return {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      // Host: '',
      Connection: 'keep-alive',
      Accept: '*/*',
      // Authorization: '',
    };
  }

  /**
   * @returns Always returns code 200 if API is stable
   */
  async deposit(data: DepositDto) {
    console.log('DEPOSIT DATA ============>', data);
    return axios
      .post<DepositResponse>(`${this._baseUrl}/deposit`, data, {
        headers: this._header,
      })
      .then((res) => res.data);
  }

  async withdraw(data: WithdrawDto) {
    console.log('WITHDRAW DATA ============>', data);
    return axios
      .post<WithdrawResponse>(`${this._baseUrl}/withdraw`, data, {
        headers: this._header,
      })
      .then((res) => res.data);
  }

  async swap(data: SwapDto) {
    console.log('SWAP DATA ============>', data);
    return axios
      .post<SwapResponse>(`${this._baseUrl}/swap`, data, {
        headers: this._header,
      })
      .then((res) => res.data);
  }
}
