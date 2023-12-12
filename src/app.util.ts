import * as crypto from 'crypto';
import { ContractTransactionResponse, ethers } from 'ethers';
import * as erc20Abi from './abis/erc20.json';

const algorithm = 'aes256';

export function encryptData(data: string, securityKey: string): string {
  const cipher = crypto.createCipher(algorithm, securityKey);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

export function decryptData(data: string, securityKey: string): string {
  const decipher = crypto.createDecipher(algorithm, securityKey);
  return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
}

export function verifyPrivateKey(value: string) {
  try {
    new ethers.Wallet(value);
  } catch (e) {
    return false;
  }
  return true;
}

export function verifySecretKey(value: string) {
  try {
    // '0xAnon:' + params.amount + ':' + _publicKey + ':' + _privateKey;
    const _ = value.split(':');
    const amount = _[1];
    const publicKey = _[2];
    const privateKey = _[3];
    if (
      (_[0] ?? '').toLowerCase() == '0xAnon'.toLowerCase() &&
      amount &&
      publicKey &&
      privateKey
    ) {
      return {
        amount,
        publicKey,
        privateKey,
      };
    }
    return false;
  } catch (error) {
    return false;
  }
}

export function withDecimals(amount: number, decimals: number) {
  return (amount * 10 ** decimals).toLocaleString('fullwide', {
    useGrouping: false,
  });
}

export const getNativeBalance = async (
  provider: ethers.JsonRpcProvider,
  address: string,
  decimals: number,
) => {
  return provider.getBalance(address).then((bigNumBalance) => {
    const strBalance = ethers
      .formatUnits(bigNumBalance, decimals)
      .slice(0, decimals / 2);
    return parseFloat(strBalance);
  });
};

export const getErc20Balance = async (
  provider: ethers.ContractRunner,
  tokenAddress: string,
  walletAddress: string,
  decimals: number,
) => {
  const ERC20 = new ethers.Contract(tokenAddress, erc20Abi, provider);
  return ERC20.balanceOf(walletAddress).then((bigNumBalance: any) => {
    const strBalance = ethers.formatUnits(bigNumBalance, decimals).slice(0, 9);
    return parseFloat(strBalance);
  });
};

export const approveErc20 = async (
  wallet: ethers.Wallet,
  tokenAddress: string,
  spender: string,
  amount: string | number,
): Promise<ContractTransactionResponse> => {
  const ERC20 = new ethers.Contract(tokenAddress, erc20Abi, wallet);
  return ERC20.approve(spender, amount);
};

export const allowanceErc20 = async (
  wallet: ethers.Wallet,
  tokenAddress: string,
  spender: string,
): Promise<number> => {
  const ERC20 = new ethers.Contract(tokenAddress, erc20Abi, wallet);
  return ERC20.allowance(wallet.address, spender);
};

export const shortAddress = (address: string) => {
  return (
    address.substring(0, 6) +
    '...' +
    address.substring(address.length - 4, address.length)
  );
};
