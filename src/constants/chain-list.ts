import { ethers } from 'ethers';
import * as eTokens from './tokens/1.json';
import * as bTokens from './tokens/56.json';
import * as aTokens from './tokens/42161.json';
import * as pTokens from './tokens/137.json';

export enum ChainId {
  Ethereum = 1,
  BinanceSmartChain = 56,
  Arbitrum = 42161,
  Polygon = 137,
}

export interface ChainInfo {
  name: string;
  rpc: string;
  hasExplorer: boolean;
  explorer: {
    name: string;
    root: string;
    address: string;
    tx: string;
    token: string;
  };
  chart: string;
  rpcProvider: ethers.JsonRpcProvider;
  logo: string;
  chainId: ChainId;
  native: Token;
  wrap: Token;
  tokens: { [address: string]: Token };
}

export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logoURI: string;
  tags: string[];
}

export const ChainList: { [chain in ChainId]: ChainInfo } = {
  [ChainId.Ethereum]: {
    name: 'Ethereum',
    rpc: 'https://eth.llamarpc.com',
    hasExplorer: true,
    explorer: {
      name: 'EtherScan',
      root: 'https://etherscan.io/',
      address: 'address/',
      tx: 'tx/',
      token: 'token/',
    },
    chart: 'https://www.geckoterminal.com/eth/pools',
    rpcProvider: new ethers.JsonRpcProvider('https://eth.llamarpc.com'),
    logo: '',
    chainId: ChainId.Ethereum,
    native: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      logoURI:
        'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
      tags: ['native', 'PEG:ETH'],
    },
    wrap: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      decimals: 18,
      logoURI:
        'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
      tags: ['tokens', 'PEG:ETH'],
    },
    tokens: eTokens,
  },
  [ChainId.BinanceSmartChain]: {
    name: 'Binance Smart Chain',
    rpc: 'https://bsc-dataseed4.bnbchain.org',
    hasExplorer: true,
    explorer: {
      name: 'BscScan',
      root: 'https://bscscan.com/',
      address: 'address/',
      tx: 'tx/',
      token: 'token/',
    },
    chart: 'https://www.geckoterminal.com/bsc/pools',
    rpcProvider: new ethers.JsonRpcProvider(
      'https://bsc-dataseed.binance.org/',
    ),
    logo: '',
    chainId: ChainId.BinanceSmartChain,
    native: {
      symbol: 'BNB',
      name: 'BNB',
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      logoURI:
        'https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png',
      tags: ['native'],
    },
    wrap: {
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      decimals: 18,
      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      logoURI:
        'https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png',
      tags: ['tokens', 'PEG:BNB'],
    },
    tokens: bTokens,
  },
  [ChainId.Arbitrum]: {
    name: 'Arbitrum',
    rpc: 'https://arb1.arbitrum.io/rpc/',
    hasExplorer: true,
    explorer: {
      name: 'ArbiScan',
      root: 'https://arbiscan.io/',
      address: 'address/',
      tx: 'tx/',
      token: 'token/',
    },
    chart: 'https://www.geckoterminal.com/arbitrum/pools',
    rpcProvider: new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc/'),
    logo: '',
    chainId: ChainId.Arbitrum,
    native: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      logoURI:
        'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
      tags: ['native'],
    },
    wrap: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      logoURI:
        'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
      tags: ['tokens', 'PEG:ETH'],
    },
    tokens: aTokens,
  },

  [ChainId.Polygon]: {
    name: 'Polygon',
    rpc: 'https://polygon-rpc.com/',
    hasExplorer: true,
    explorer: {
      name: 'PolygonScan',
      root: 'https://polygonscan.com/',
      address: 'address/',
      tx: 'tx/',
      token: 'token/',
    },
    chart: 'https://www.geckoterminal.com/polygon_pos/pools',
    rpcProvider: new ethers.JsonRpcProvider('https://polygon-rpc.com/'),
    logo: '',
    chainId: ChainId.Polygon,
    native: {
      symbol: 'MATIC',
      name: 'MATIC',
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      logoURI:
        'https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png',
      tags: ['native'],
    },
    wrap: {
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      decimals: 18,
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      logoURI:
        'https://tokens.1inch.io/0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270.png',
      tags: ['tokens'],
    },
    tokens: pTokens,
  },
};

// [{"_id":"6540791a88de79be48aba336","telegramId":"5351332067","wallets":["0x4E4f8363FBD6E0fD224bF88F0f2Cb9d08C4db535","0xfe9397b46d072B2d2C7aD69d5aD8106ac55f1B91"],"privateKeys":["1577eb18341b5b3e0f9648d348a417dee1b307ac2493af3ad1798f169acab98ce593d2f7ca72064a2ff0845ef96077d134efbc7fb217f71f83f02befb09981bea042e11fcc9837d2a10bea7d66b77773","83bc1a825a913d69e61386c89527b2b27bc5f64d12fe0818432cfd6535433de75650d12702362b6260005f4fac911f710945f35ce3318a43cecc88c729a54e2ebaa2d37683c1376196b37552fd67d285"],"chainId":1,"password":"$2b$10$ioos3t0lwZ/soJz8mp4eQO.RAqnHmkppZqenEvyFSX5elaq0mk.QW","timestamp":1698724082750,"status":true,"__v":0}]
