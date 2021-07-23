// Copyright (c) 2012-2017, The CryptoNote developers, The Bytecoin developers
// Copyright (c) 2014-2018, The Monero Project
// Copyright (c) 2016-2018, The Karbowanec developers
// Copyright (c) 2018, The TurtleCoin Developers
// 
// Please see the included LICENSE file for more information.

#pragma once

#include <vector>

#include "CryptoTypes.h"
#include "crypto-ops.h"

namespace Crypto
{
    struct EllipticCurvePoint
    {
        uint8_t data[32];
    };

    struct EllipticCurveScalar
    {
        uint8_t data[32];
    };

    std::tuple<bool, std::vector<Signature>> generateRingSignatures(
        const Hash prefixHash,
        const KeyImage keyImage,
        const std::vector<PublicKey> publicKeys,
        const Crypto::SecretKey transactionSecretKey,
        uint64_t realOutput);

    bool checkRingSignature(
        const Hash &prefix_hash,
        const KeyImage &image,
        const std::vector<PublicKey> pubs,
        const std::vector<Signature> signatures);

    bool underive_public_key(
        const KeyDerivation &derivation,
        const size_t output_index,
        const PublicKey &derived_key,
        PublicKey &base);

    bool generate_key_derivation(
        const PublicKey &key1,
        const SecretKey &key2,
        KeyDerivation &derivation);

    bool derive_public_key(
        const KeyDerivation &derivation,
        const size_t output_index,
        const PublicKey &base,
        PublicKey &derived_key);

    void derive_secret_key(
        const KeyDerivation &derivation,
        const size_t output_index,
        const SecretKey &base,
        SecretKey &derived_key);

    void generate_key_image(
        const PublicKey &pub,
        const SecretKey &sec,
        KeyImage &image);

    void derivation_to_scalar(
        const KeyDerivation &derivation,
        size_t output_index,
        EllipticCurveScalar &res);

    void hash_to_scalar(
        const void *data,
        const size_t length,
        EllipticCurveScalar &res);

    void hash_to_ec(
        const PublicKey &key,
        ge_p3 &res);
}
