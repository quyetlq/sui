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
tx.moveCall({
  target: "0x2::sui::transfer",
  arguments: [tx.pure("0x2c4d18f83856f2e6d8d6caffd8e7994a446e802d85bd9bd69c748f0b5c5eb19f"), tx.pure("0x677ce73081a77d1705429d28928073cb38dc02a800b5dc596dbff8d42e025fa7")],
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
  const { currentAccount, signTransaction } = useWalletKit();
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
              Sponsor Transaction
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
                  const signed = await signTransaction({
                    transaction: Transaction.from(
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
