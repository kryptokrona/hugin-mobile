package com.hugin;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;

public class SpendKey {
    String publicKey;
    String privateKey;

    public SpendKey(String publicKey, String privateKey) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    public SpendKey(ReadableMap map) {
        this(
            map.getString("publicKey"),
            map.getString("privateKey")
        );
    }
}
