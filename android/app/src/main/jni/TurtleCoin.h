#include "Types.h"

#include <unordered_map>

#include <jni.h>

jint JNI_OnLoad(JavaVM *vm, void *reserved);

std::vector<Crypto::PublicKey> makeNativePublicKeys(JNIEnv *env, jobjectArray jPublicKeys);

std::vector<Crypto::Signature> makeNativeSignatures(JNIEnv *env, jobjectArray jSignatures);

WalletBlockInfo makeNativeWalletBlockInfo(JNIEnv *env, jobject jWalletBlockInfo);

std::string makeNativeString(JNIEnv *env, jstring jStr);

std::unordered_map<Crypto::PublicKey, Crypto::SecretKey> makeNativeSpendKeys(JNIEnv *env, jobjectArray jSpendKeys);

jobjectArray makeJNIInputs(JNIEnv *env, const std::vector<std::tuple<Crypto::PublicKey, TransactionInput>> &inputs);

jobject makeJNIInput(JNIEnv *env, const TransactionInput &input);

jobjectArray makeJNISignatures(JNIEnv *env, const std::vector<Crypto::Signature> &signatures);

RawTransaction makeNativeRawTransaction(JNIEnv *env, jobject jRawTransaction);

std::vector<KeyOutput> makeNativeKeyOutputVector(JNIEnv *env, jobjectArray jKeyOutputs);

KeyOutput makeNativeKeyOutput(JNIEnv *env, jobject jKeyOutput);

std::vector<RawTransaction> makeNativeTransactionVector(JNIEnv *env, jobjectArray jTransactions);

void byteArrayToHexString(const uint8_t *input, char *output, size_t inputLen);

int char2int(char input);

void hexStringToByteArray(const char* input, uint8_t* output, size_t outputLen);

std::vector<std::tuple<Crypto::PublicKey, TransactionInput>> processBlockOutputs(
    const WalletBlockInfo &block,
    const Crypto::SecretKey &privateViewKey,
    const std::unordered_map<Crypto::PublicKey, Crypto::SecretKey> &spendKeys,
    const bool isViewWallet,
    const bool processCoinbaseTransactions);

void processTransactionOutputs(
    const RawTransaction &tx,
    const Crypto::SecretKey &privateViewKey,
    const std::unordered_map<Crypto::PublicKey, Crypto::SecretKey> &spendKeys,
    const bool isViewWallet,
    std::vector<std::tuple<Crypto::PublicKey, TransactionInput>> &inputs);

template<typename T>
T makeNative32ByteKey(JNIEnv *env, jstring jKey)
{
    T result;
    const char *nativeString = env->GetStringUTFChars(jKey, nullptr);
    hexStringToByteArray(nativeString, result.data, 32);
    env->ReleaseStringUTFChars(jKey, nativeString);
    return result;
}

template<typename T>
T makeNative64ByteKey(JNIEnv *env, jstring jKey)
{
    T result;
    const char *nativeString = env->GetStringUTFChars(jKey, nullptr);
    hexStringToByteArray(nativeString, result.data, 64);
    env->ReleaseStringUTFChars(jKey, nativeString);
    return result;
}

template<typename T>
jstring makeJNI32ByteKey(JNIEnv *env, T byteKey)
{
    /* +1 for \0 byte */
    char output[64 + 1];
    byteArrayToHexString(byteKey.data, output, 32);
    output[64] = '\0';
    return env->NewStringUTF(output);
}

template<typename T>
jstring makeJNI64ByteKey(JNIEnv *env, T byteKey)
{
    /* +1 for \0 byte */
    char output[128 + 1];
    byteArrayToHexString(byteKey.data, output, 64);
    output[128] = '\0';
    return env->NewStringUTF(output);
}
