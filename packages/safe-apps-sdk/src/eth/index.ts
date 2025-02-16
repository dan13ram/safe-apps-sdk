import { RPC_CALLS } from '../eth/constants';
import {
  BlockNumberArg,
  RpcCallNames,
  Communicator,
  Log,
  BlockTransactionString,
  BlockTransactionObject,
  Web3TransactionObject,
  RPCPayload,
  TransactionConfig,
  Web3TransactionReceiptObject,
  PastLogsOptions,
} from '../types';
import { METHODS } from '../communication/methods';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Formatter = (arg: any) => any;

const inputFormatters: Record<string, Formatter> = {
  defaultBlockParam: (arg = 'latest') => arg,
  returnFullTxObjectParam: (arg = false): boolean => arg,
  blockNumberToHex: (arg: BlockNumberArg): string =>
    Number.isInteger(arg) ? `0x${arg.toString(16)}` : (arg as string),
};

type BuildRequestArgs = {
  call: RpcCallNames;
  formatters?: (Formatter | null)[];
};

class Eth {
  public call;
  public getBalance;
  public getCode;
  public getStorageAt;
  public getPastLogs;
  public getBlockByHash;
  public getBlockByNumber;
  public getTransactionByHash;
  public getTransactionReceipt;
  #communicator: Communicator;

  constructor(communicator: Communicator) {
    this.#communicator = communicator;
    this.call = this.buildRequest<[TransactionConfig, string?], string>({
      call: RPC_CALLS.eth_call,
      formatters: [null, inputFormatters.defaultBlockParam],
    });
    this.getBalance = this.buildRequest<[string, string?], string>({
      call: RPC_CALLS.eth_getBalance,
      formatters: [null, inputFormatters.defaultBlockParam],
    });
    this.getCode = this.buildRequest<[string, string?], string>({
      call: RPC_CALLS.eth_getCode,
      formatters: [null, inputFormatters.defaultBlockParam],
    });
    this.getStorageAt = this.buildRequest<[string, number, string?], string>({
      call: RPC_CALLS.eth_getStorageAt,
      formatters: [null, inputFormatters.blockNumberToHex, inputFormatters.defaultBlockParam],
    });
    this.getPastLogs = this.buildRequest<[PastLogsOptions], Log[]>({
      call: RPC_CALLS.eth_getLogs,
    });
    this.getBlockByHash = this.buildRequest<[string, boolean?], BlockTransactionString | BlockTransactionObject>({
      call: RPC_CALLS.eth_getBlockByHash,
      formatters: [null, inputFormatters.returnFullTxObjectParam],
    });
    this.getBlockByNumber = this.buildRequest<
      [BlockNumberArg, boolean?],
      BlockTransactionString | BlockTransactionObject
    >({
      call: RPC_CALLS.eth_getBlockByNumber,
      formatters: [inputFormatters.blockNumberToHex, inputFormatters.returnFullTxObjectParam],
    });
    this.getTransactionByHash = this.buildRequest<[string], Web3TransactionObject>({
      call: RPC_CALLS.eth_getTransactionByHash,
    });
    this.getTransactionReceipt = this.buildRequest<[string], Web3TransactionReceiptObject>({
      call: RPC_CALLS.eth_getTransactionReceipt,
    });
  }

  private buildRequest<P extends unknown[], R = unknown>({ call, formatters }: BuildRequestArgs) {
    return async (params: P): Promise<R> => {
      if (formatters && Array.isArray(params)) {
        formatters.forEach((formatter: ((...args: unknown[]) => unknown) | null, i) => {
          if (formatter) {
            params[i] = formatter(params[i]);
          }
        });
      }

      const payload: RPCPayload<P> = {
        call,
        params,
      };

      const response = await this.#communicator.send<'rpcCall', RPCPayload<P>, R>(METHODS.rpcCall, payload);

      if (!response.success) {
        throw new Error(response.error);
      }

      return response.data;
    };
  }
}

export { Eth };
