package com.hugin;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

public class WalletBlockInfo {
    RawTransaction coinbaseTransaction;
    RawTransaction[] transactions;

    public WalletBlockInfo() {}

    public WalletBlockInfo(
        RawTransaction coinbaseTransaction,
        RawTransaction[] transactions) {
        this.coinbaseTransaction = coinbaseTransaction;
        this.transactions = transactions;
    }

    public WalletBlockInfo(ReadableMap map) {
        this(
            map.hasKey("coinbaseTransaction") ? new RawTransaction(map.getMap("coinbaseTransaction")) : null,
            RawTxVector(map.getArray("transactions"))
        );
    }

    private static RawTransaction[] RawTxVector(ReadableArray arr) {
        RawTransaction[] txs = new RawTransaction[arr.size()];

        for (int i = 0; i < arr.size(); i++) {
            txs[i] = new RawTransaction(arr.getMap(i));
        }

        return txs;
    }
}
