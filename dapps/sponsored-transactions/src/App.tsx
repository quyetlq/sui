// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import {
  SignedTransaction,
  SuiTransactionBlockResponse,
  TransactionBlock,
} from "@mysten/sui.js";
import { ConnectButton, useWalletKit } from "@mysten/wallet-kit";
import { ComponentProps, ReactNode, useState } from "react";
import { provider } from "./utils/rpc";
import { sponsorTransaction } from "./utils/sponsorTransaction";

const tx = new TransactionBlock();
// tx.moveCall({
//   target: `0x24a69ea93ade7253fd6a820409ab3773edf017388df065944d0d91ae8dbd20f5::marketplace::list`,
//   arguments: [tx.pure("0x30fc718f9807b5d81853573f8c127db47b340af5f6c3a2e32d964fa0e249ebca"), tx.pure("0x83ba2bff4f268c5c487767f467f9b1a7ff5600a6ef152f59b0a77881f02edfb9"), tx.pure(String(0.02 * 10**9))],
//   typeArguments: ["0x9877e0cac9acceb710e1308f3b0e129fc8a2f437fe2fa0505b9dc95eeafbf0ce::ethos_example_nft::EthosNFT"],
// });
tx.moveCall({
  target: "0x7ba8e170b509f986c1a0e89a65d3f27490795a1c2200e10ea1aa4d4f171488ce::devnet_nft::mint",
  arguments: [tx.pure("Skeleton Machine"), tx.pure("Skeleton Machine"), tx.pure("https://i.etsystatic.com/36252069/r/il/9c0312/3999095287/il_794xN.3999095287_rd5w.jpg")],
});

const Button = (props: ComponentProps<"button">) => (
  <button
    className="bg-indigo-600 text-sm font-medium text-white rounded-lg px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
    {...props}
  />
);

const CodePanel = ({
  title,
  json,
  action,
}: {
  title: string;
  json: object | null;
  action: ReactNode;
}) => (
  <div>
    <div className="text-lg font-bold mb-2">{title}</div>
    <div className="mb-4">{action}</div>
    <code className="block bg-gray-200 p-2 text-gray-800 rounded text-sm break-all whitespace-pre-wrap">
      {JSON.stringify(json, null, 2)}
    </code>
  </div>
);

export function App() {
  const { currentAccount, signTransactionBlock } = useWalletKit();
  const [loading, setLoading] = useState(false);
  const [sponsoredTx, setSponsoredTx] = useState<SignedTransaction | null>(
    null
  );
  const [signedTx, setSignedTx] = useState<SignedTransaction | null>(null);
  const [executedTx, setExecutedTx] =
    useState<SuiTransactionBlockResponse | null>(null);

  return (
    <div className="p-8">
      <div className="grid grid-cols-4 gap-8">
        <CodePanel
          title="Transaction details"
          json={tx.transactionData}
          action={<ConnectButton className="!bg-indigo-600 !text-white" />}
        />

        <CodePanel
          title="Sponsored Transaction"
          json={sponsoredTx}
          action={
            <Button
              disabled={!currentAccount || loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const bytes = await tx.build({
                    provider,
                    onlyTransactionKind: true,
                  });
                  const sponsoredBytes = await sponsorTransaction(
                    currentAccount!.address,
                    bytes
                  );
                  setSponsoredTx(sponsoredBytes);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Request Mint NFT
            </Button>
          }
        />

        <CodePanel
          title="Signed Transaction"
          json={signedTx}
          action={
            <Button
              disabled={!sponsoredTx || loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const signed = await signTransactionBlock({
                    transactionBlock: TransactionBlock.from(
                      sponsoredTx!.transactionBlockBytes
                    ),
                  });
                  setSignedTx(signed);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Sign Transaction
            </Button>
          }
        />
        <CodePanel
          title="Executed Transaction"
          json={executedTx}
          action={
            <Button
              disabled={!signedTx || loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const executed = await provider.executeTransactionBlock({
                    transactionBlock: signedTx!.transactionBlockBytes,
                    signature: [signedTx!.signature, sponsoredTx!.signature],
                    options: {
                      showEffects: true,
                      showEvents: true,
                      showObjectChanges: true,
                    },
                  });
                  setExecutedTx(executed);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Execute Transaction
            </Button>
          }
        />
      </div>
    </div>
  );
}
