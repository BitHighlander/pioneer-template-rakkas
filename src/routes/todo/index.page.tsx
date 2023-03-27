import { useState, useEffect } from "react";
import { Todo } from "./Todo";
import css from "./page.module.css";
import {
  runServerSideMutation,
  useMutation,
  useServerSideQuery,
} from "rakkasjs";

import { createTodo, readAllTodos } from "src/crud";
import { NativeAdapter } from "@shapeshiftoss/hdwallet-native";
import * as metaMask from "@shapeshiftoss/hdwallet-metamask";
import * as core from "@shapeshiftoss/hdwallet-core";
import { entropyToMnemonic } from "bip39";

export default function TodoPage() {
  const { data, refetch } = useServerSideQuery(readAllTodos, {
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const [text, setText] = useState("");



    const onStart = async function(){
        try{
            const keyring = new core.Keyring();
            // MM
            const metaMaskAdapter = metaMask.MetaMaskAdapter.useKeyring(keyring);
            const walletMetaMask = await metaMaskAdapter.pairDevice();
            const hashStored = localStorage.getItem("hash");
            if(!hashStored){
                if (walletMetaMask) {
                    await walletMetaMask.initialize();
                    //sign
                    const { hardenedPath, relPath } = walletMetaMask.ethGetAccountPaths({
                        coin: "Ethereum",
                        accountIdx: 0,
                    })[0];
                    const message = "Pioneers:0xD9B4BEF9:gen1";
                    const sig = await walletMetaMask.ethSignMessage({
                        addressNList: hardenedPath.concat(relPath),
                        message,
                    });
                    if(sig && sig.signature)localStorage.setItem("hash", sig.signature);
                }
            }
            const hashSplice = (str: string | any[] | null) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return str.slice(0, 34);
            };
            const hash = hashSplice(hashStored);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const hashBytes = hash.replace("0x", "");
            const mnemonic = entropyToMnemonic(hashBytes.toString(`hex`));
            // eslint-disable-next-line no-console
            console.log("mnemonic: ",mnemonic)
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const nativeAdapter = NativeAdapter.useKeyring(keyring);
            const walletSoftware = await nativeAdapter.pairDevice("testid");
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            walletSoftware.loadDevice({ mnemonic });
            await nativeAdapter.initialize();
            // eslint-disable-next-line no-console
            console.log("walletSoftware: ",walletSoftware)
            // eslint-disable-next-line no-console
            console.log("isInitialized: ",await walletSoftware?.isInitialized())
            // eslint-disable-next-line no-console
            console.log("getLabel: ",await walletSoftware?.getLabel())

            //get eth address
            const addressInfo = {
                addressNList: [2147483692, 2147483708, 2147483648, 0, 0],
                coin: 'Ethereum',
                scriptType: 'ethereum',
                showDisplay: false
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const ethAddress = await walletSoftware.ethGetAddress(addressInfo);
            // eslint-disable-next-line no-console
            console.log("ethAddress: ",ethAddress)
        }catch(e){
            console.error(e)
        }
    }
    // onstart get data
    useEffect(() => {
        onStart();
    }, []);

  const { mutate: create } = useMutation(async () => {
    await runServerSideMutation(() => createTodo({ text, done: false }));
    refetch();
  });

  return (
    <main>
      <h1>Todo</h1>

      <p>This is a simple todo application that demonstrates data fetching.</p>

      <ul className={css.todoList}>
        {data.map((todo) => (
          <Todo key={todo.id} todo={todo} refetch={refetch} />
        ))}
      </ul>

      <p className={css.p}>
        <input
          className={css.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          type="button"
          className={css.addButton}
          disabled={!text}
          onClick={() => create()}
        >
          Add
        </button>
      </p>
    </main>
  );
}
