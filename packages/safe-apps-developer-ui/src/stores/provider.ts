import create from 'zustand';
import { Web3Provider, JsonRpcSigner } from '@ethersproject/providers';
import { ETHEREUM_NETWORK_TO_ID, WALLET_PROVIDER } from 'src/api/provider';

type ProviderState = {
  loaded: boolean;
  account: string;
  name: string;
  networkId: ETHEREUM_NETWORK_TO_ID;
  provider: Web3Provider | null;
  signer: JsonRpcSigner | null;
  fetchAndSetProvider: (provider: Web3Provider) => Promise<void>;
  disconnect: () => void;
};

const useProviderStore = create<ProviderState>((set) => ({
  loaded: false,
  account: '',
  name: WALLET_PROVIDER.UNKNOWN,
  networkId: ETHEREUM_NETWORK_TO_ID.UNKNOWN,
  provider: null,
  signer: null,

  fetchAndSetProvider: async (provider: Web3Provider) => {
    const account = (await provider.listAccounts())[0];
    const { chainId: networkId } = await provider.getNetwork();

    return set({ account, loaded: true, networkId, provider, signer: provider.getSigner() });
  },

  disconnect: () =>
    set({
      loaded: false,
      account: '',
      networkId: ETHEREUM_NETWORK_TO_ID.UNKNOWN,
      provider: null,
      signer: null,
    }),
}));

export { useProviderStore };
