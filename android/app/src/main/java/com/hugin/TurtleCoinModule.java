package com.hugin;

import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import com.hugin.BuildConfig;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import org.json.JSONArray;
import org.json.JSONObject;

public class TurtleCoinModule extends ReactContextBaseJavaModule {
    static {
        System.loadLibrary("TurtleCoin_jni");
    }

    public TurtleCoinModule(ReactApplicationContext reactContext) {
        super(reactContext); //required by React Native
    }

    /* Access this by doing NativeModules.TurtleCoin in react */
    @Override
    public String getName() {
        return "TurtleCoin";
    }

    @ReactMethod
    public void generateKeyImage(
        final String publicEphemeral,
        final String privateEphemeral,
        final Promise promise) {

        new Thread(new Runnable() {
            public void run() {
                try {
                    String key = generateKeyImageJNI(
                        publicEphemeral,
                        privateEphemeral
                    );

                    promise.resolve(key);
                } catch (Exception e) {
                    promise.reject("Error in generate key image: ", e);
                }
            }
        }).start();
    }

    @ReactMethod
    public void deriveSecretKey(
        final String derivation,
        final ReadableMap outputIndex,
        final String privateSpendKey,
        final Promise promise) {

        new Thread(new Runnable() {
            public void run() {
                try {
                    String key = deriveSecretKeyJNI(
                        derivation,
                        (long)outputIndex.getDouble("outputIndex"),
                        privateSpendKey
                    );

                    promise.resolve(key);
                } catch (Exception e) {
                    promise.reject("Error in derive secret key: ", e);
                }
            }
        }).start();
    }

    @ReactMethod
    public void derivePublicKey(
        final String derivation,
        final ReadableMap outputIndex,
        final String publicSpendKey,
        final Promise promise) {

        new Thread(new Runnable() {
            public void run() {
                try {
                    String key = derivePublicKeyJNI(
                        derivation,
                        (long)outputIndex.getDouble("outputIndex"),
                        publicSpendKey
                    );

                    promise.resolve(key);
                } catch (Exception e) {
                    promise.reject("Error in derive public key: ", e);
                }
            }
        }).start();
    }

    @ReactMethod
    public void generateKeyDerivation(
        final String transactionPublicKey,
        final String privateViewKey,
        final Promise promise) {

        new Thread(new Runnable() {
            public void run() {
                try {
                    String key = generateKeyDerivationJNI(
                        transactionPublicKey,
                        privateViewKey
                    );

                    promise.resolve(key);
                } catch (Exception e) {
                    promise.reject("Error in generate key derivation: ", e);
                }
            }
        }).start();
    }

    @ReactMethod
    public void generateRingSignatures(
        final String transactionPrefixHash,
        final String keyImage,
        final ReadableArray inputKeys,
        final String privateKey,
        final ReadableMap realIndex,
        final Promise promise) {

        new Thread(new Runnable() {
            public void run() {
                try {
                    String[] signatures = generateRingSignaturesJNI(
                        transactionPrefixHash,
                        keyImage,
                        arrayToInputKeys(inputKeys),
                        privateKey,
                        (long)realIndex.getDouble("realIndex")
                    );

                    promise.resolve(signaturesToArray(signatures));
                } catch (Exception e) {
                    promise.reject("Error in generate ring signatures: ", e);
                }
            }
        }).start();
    }

    @ReactMethod
    public void checkRingSignature(
        final String transactionPrefixHash,
        final String keyImage,
        final ReadableArray inputKeys,
        final ReadableArray signatures,
        final Promise promise) {
        new Thread(new Runnable() {
            public void run() {
                try {
                    boolean success = checkRingSignatureJNI(
                        transactionPrefixHash,
                        keyImage,
                        arrayToInputKeys(inputKeys),
                        arrayToInputKeys(signatures)
                    );

                    promise.resolve(success);
                } catch (Exception e) {
                    promise.reject("Error in generate ring signatures: ", e);
                }
            }
        }).start();
    }

    @ReactMethod
    public void processBlockOutputs(
        final ReadableMap block,
        final String privateViewKey,
        final ReadableArray spendKeys,
        final boolean isViewWallet,
        final boolean processCoinbaseTransactions,
        final Promise promise) {

        new Thread(new Runnable() {
            public void run() {
                try {
                    InputMap[] inputs = processBlockOutputsJNI(
                        new WalletBlockInfo(block),
                        privateViewKey,
                        arrayToSpendKeys(spendKeys),
                        isViewWallet,
                        processCoinbaseTransactions
                    );

                    promise.resolve(mapToArray(inputs));

                } catch (Exception e) {
                    promise.reject("Error in process block outputs: ", e);
                }
            }
        }).start();
    }

    @ReactMethod
    public void getWalletSyncData(
        ReadableArray blockHashCheckpointsJS,
        final double startHeight,
        final double startTimestamp,
        final double blockCount,
        final boolean skipCoinbaseTransactions,
        final String url,
        final Promise promise) {

        final String[] blockHashCheckpoints = new String[blockHashCheckpointsJS.size()];

        for (int i = 0; i < blockHashCheckpointsJS.size(); i++) {
            blockHashCheckpoints[i] = blockHashCheckpointsJS.getString(i);
        }

        new Thread(new Runnable() {
            public void run() {
                getWalletSyncDataImpl(
                    blockHashCheckpoints,
                    (long)startHeight,
                    (long)startTimestamp,
                    (long)blockCount,
                    skipCoinbaseTransactions,
                    url,
                    promise
                );
            }
        }).start();
    }

    @ReactMethod
    public void navigateToBatteryOptimizationScreen(Promise promise) {
        Intent myIntent = new Intent();

        myIntent.setAction(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        myIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        getReactApplicationContext().startActivity(myIntent);

        promise.resolve("");
    }

    @ReactMethod
    public void isDozeDisabled(Promise promise) {
        PowerManager pm = (PowerManager)getReactApplicationContext().getSystemService(Context.POWER_SERVICE);
        promise.resolve(pm.isIgnoringBatteryOptimizations(getReactApplicationContext().getPackageName()));
    }

    private static long BLOCK_COUNT = 100;

    private void getWalletSyncDataImpl(
        String[] blockHashCheckpoints,
        long startHeight,
        long startTimestamp,
        long blockCount,
        boolean skipCoinbaseTransactions,
        String url,
        Promise promise) {

        /* If the user has specified < 100 per request */
        if (blockCount < BLOCK_COUNT)
        {
            BLOCK_COUNT = blockCount;
        }
        else if (BLOCK_COUNT < 1)
        {
            BLOCK_COUNT = 1;
        }

        try
        {
            URL obj = new URL(url);
            HttpURLConnection connection = (HttpURLConnection) obj.openConnection();

            /* 10 second timeout */
            connection.setConnectTimeout(10000);

            /* We're sending a JSON post */
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            connection.setRequestProperty("Accept", "application/json");

            /* tonchan-vx.x.x */
            connection.setRequestProperty("User-Agent", "hugin-messenger-v1.1.2");

            /* Indicate we have a POST body */
            connection.setDoOutput(true);

            DataOutputStream wr = new DataOutputStream(connection.getOutputStream());

            JSONObject json = new JSONObject();

            JSONArray checkpoints = new JSONArray();

            for (int i = 0; i < blockHashCheckpoints.length; i++)
            {
                checkpoints.put(blockHashCheckpoints[i]);
            }

            json.put("blockHashCheckpoints", checkpoints);

            json.put("startHeight", startHeight);
            json.put("startTimestamp", startTimestamp);
            json.put("blockCount", blockCount);
            json.put("skipCoinbaseTransactions", skipCoinbaseTransactions);

            String params = json.toString();

            Log.d("ReactNative", "Making request to /getwalletsyncdata with params " + params);

            wr.writeBytes(params);
            wr.flush();
            wr.close();

            int responseCode = connection.getResponseCode();

            if (responseCode != 200)
            {
                Log.i("ReactNative", "Failed to fetch, response code: " + responseCode);
                throw new Exception("Failed to fetch, response code: " + responseCode);
            }

            int oneMegaByte = 1024 * 1024;

            BufferedReader in = new BufferedReader(
                new InputStreamReader(connection.getInputStream(), "UTF-8"),
                oneMegaByte
            );

            StringBuffer response = new StringBuffer();

            char[] inputBuffer = new char[8192];

            int len = 0;

            while ((len = in.read(inputBuffer)) != -1)
            {
                /* Need block count to be > 1 otherwise we will never sync a single block > 2MB */
                if (BLOCK_COUNT > 1 && (response.length() >= (2 * oneMegaByte) || len >= 2 * oneMegaByte))
                {
                    in.close();

                    BLOCK_COUNT /= 4;

                    if (BLOCK_COUNT == 0)
                    {
                        BLOCK_COUNT = 1;
                    }

                    Log.i("ReactNative", "Response too large, trying again with block count of " + BLOCK_COUNT);

                    /* Response is too large, and will likely cause us to go OOM
                       and crash. Lets half the block count and try again. */
                    getWalletSyncDataImpl(
                        blockHashCheckpoints,
                        startHeight,
                        startTimestamp,
                        BLOCK_COUNT,
                        skipCoinbaseTransactions,
                        url,
                        promise
                    );

                    return;
                }

                response.append(new String(inputBuffer, 0, len));
            }

            if (BLOCK_COUNT * 2 > 100)
            {
                BLOCK_COUNT = 100;
            }
            else
            {
                BLOCK_COUNT *= 2;
            }

            Log.d("ReactNative", "Updating block count to " + BLOCK_COUNT);

            in.close();

            String responseData = response.toString();

            Log.d("ReactNative", "Got response from /getwalletsyncdata with body " + responseData);

            promise.resolve(responseData);
        }
        catch (Exception e)
        {
            WritableMap map = Arguments.createMap();
            map.putString("error", e.getMessage());

            Log.i("ReactNative", "Failed to fetch, error: " + e.getMessage());

            promise.resolve(map);
        }
    }

    private String[] arrayToInputKeys(ReadableArray inputKeys) {
        String[] keys = new String[inputKeys.size()];

        for (int i = 0; i < inputKeys.size(); i++) {
            keys[i] = inputKeys.getString(i);
        }

        return keys;
    }

    private SpendKey[] arrayToSpendKeys(ReadableArray spendKeys) {
        SpendKey[] keys = new SpendKey[spendKeys.size()];

        for (int i = 0; i < spendKeys.size(); i++) {
            keys[i] = new SpendKey(spendKeys.getMap(i));
        }

        return keys;
    }

    private WritableArray signaturesToArray(String[] signatures) {
        WritableArray arr = Arguments.createArray();

        for (String signature : signatures) {
            arr.pushString(signature);
        }

        return arr;
    }

    private WritableArray mapToArray(InputMap[] inputs) {
        WritableArray arr = Arguments.createArray();

        for (InputMap input : inputs) {
            arr.pushMap(input.toWriteableMap());
        }

        return arr;
    }

    public native String generateKeyImageJNI(
        String publicEphemeral,
        String privateEphemeral
    );

    public native String deriveSecretKeyJNI(
        String derivation,
        long outputIndex,
        String privateSpendKey
    );

    public native String derivePublicKeyJNI(
        String derivation,
        long outputIndex,
        String publicSpendKey
    );

    public native String generateKeyDerivationJNI(
        String transactionPublicKey,
        String privateViewKey
    );

    public native String[] generateRingSignaturesJNI(
        String transactionPrefixHash,
        String keyImage,
        String[] inputKeys,
        String privateKey,
        long realIndex
    );

    public native boolean checkRingSignatureJNI(
        String transactionPrefixHash,
        String keyImage,
        String[] publicKeys,
        String[] signatures
    );

    public native InputMap[] processBlockOutputsJNI(
        WalletBlockInfo block,
        String privateViewKey,
        SpendKey[] spendKeys,
        boolean isViewWallet,
        boolean processCoinbaseTransactions
    );
}
