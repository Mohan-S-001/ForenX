import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { API } from "./AuthContext";

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const [provider,  setProvider]  = useState(null);
  const [signer,    setSigner]    = useState(null);
  const [account,   setAccount]   = useState(null);
  const [chainId,   setChainId]   = useState(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not installed. Please install MetaMask.");
    const _provider = new ethers.BrowserProvider(window.ethereum);
    await _provider.send("eth_requestAccounts", []);
    const _signer  = await _provider.getSigner();
    const _account = (await _signer.getAddress()).toLowerCase();
    const network  = await _provider.getNetwork();

    setProvider(_provider);
    setSigner(_signer);
    setAccount(_account);
    setChainId(Number(network.chainId));
    setConnected(true);
    return _account;
  }, []);

  const signMessage = useCallback(async (message) => {
    if (!signer) throw new Error("Wallet not connected");
    return signer.signMessage(message);
  }, [signer]);

  // Auto-reconnect if already authorized
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) connect().catch(() => {});
      });
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) { setConnected(false); setAccount(null); }
        else connect();
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, [connect]);

  return (
    <Web3Context.Provider value={{ provider, signer, account, chainId, connected, connect, signMessage }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
