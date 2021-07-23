#pragma once

#include "CryptoTypes.h"

#include <string>

#include <optional>

struct KeyOutput
{
    Crypto::PublicKey key;

    uint64_t amount;

    /* Global index of the transaction in the DB. Will be -1 if not gained
       from the daemon */
    int64_t globalIndex;
};

/* A coinbase transaction (i.e., a miner reward, there is one of these in
   every block). Coinbase transactions have no inputs. 
   
   We call this a raw transaction, because it is simply key images and
   amounts */
struct RawTransaction
{
    /* The outputs of the transaction, amounts and keys */
    std::vector<KeyOutput> keyOutputs;

    /* The hash of the transaction */
    std::string hash;

    /* The public key of this transaction, taken from the tx extra */
    Crypto::PublicKey transactionPublicKey;
};

/* A 'block' with the very basics needed to sync the transactions */
struct WalletBlockInfo
{
    /* The coinbase transaction */
    std::optional<RawTransaction> coinbaseTransaction;

    /* The transactions in the block */
    std::vector<RawTransaction> transactions;
};

struct TransactionInput
{
    /* The key image of this amount */
    Crypto::KeyImage keyImage;

    /* The value of this key image */
    uint64_t amount;

    /* The index of this input in the transaction */
    uint64_t transactionIndex;

    /* The index of this output in the 'DB' (-1 if not given) */
    int64_t globalOutputIndex;

    /* The transaction key we took from the key outputs */
    Crypto::PublicKey key;
    
    /* The transaction hash of the transaction that contains this input */
    std::string parentTransactionHash;
};
