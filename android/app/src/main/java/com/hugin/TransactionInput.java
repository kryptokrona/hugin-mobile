package com.hugin;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

public class TransactionInput {
    String keyImage;
    long amount;
    long transactionIndex;
    long globalOutputIndex;
    String key;
    String parentTransactionHash;

    public TransactionInput() {}

    public TransactionInput(
        String keyImage,
        long amount,
        long transactionIndex,
        long globalOutputIndex,
        String key,
        String parentTransactionHash) {
        this.keyImage = keyImage;
        this.amount = amount;
        this.transactionIndex = transactionIndex;
        this.globalOutputIndex = globalOutputIndex;
        this.key = key;
        this.parentTransactionHash = parentTransactionHash;
    }

    public WritableMap toWriteableMap() {
        WritableMap map = Arguments.createMap();

        map.putString("keyImage", keyImage);

        /* Should never happen in practice, but prevents a crash if it does
           happen. */
        map.putDouble("amount", amount > Double.MAX_VALUE ? Double.MAX_VALUE : (double)amount);

        map.putDouble("transactionIndex", transactionIndex > Double.MAX_VALUE ? Double.MAX_VALUE : (double)transactionIndex);

        map.putDouble("globalOutputIndex", globalOutputIndex > Double.MAX_VALUE ? Double.MAX_VALUE : (double)globalOutputIndex);

        map.putString("key", key);
        map.putString("parentTransactionHash", parentTransactionHash);

        return map;
    }
}
