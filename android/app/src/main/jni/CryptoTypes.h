// Copyright (c) 2012-2017, The CryptoNote developers, The Bytecoin developers
// Copyright (c) 2018, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

#pragma once

#include <algorithm>
#include <cstdint>

struct EllipticCurvePoint
{
    uint8_t data[32];
};

struct EllipticCurveScalar
{
    uint8_t data[32];
};

namespace Crypto
{
    struct Hash
    {
        uint8_t data[32];
    };

    struct PublicKey
    {
        uint8_t data[32];

        bool operator==(const PublicKey &other) const
        {
            return std::equal(std::begin(data), std::end(data), std::begin(other.data));
        }
    };

    struct SecretKey
    {
        uint8_t data[32];
    };

    struct KeyDerivation
    {
        uint8_t data[32];
    };

    struct KeyImage
    {
        uint8_t data[32];
    };

    struct Signature
    {
        uint8_t data[64];
    };

    inline size_t hash_value(const PublicKey &publicKey)
    {
        return reinterpret_cast<const size_t &>(publicKey);
    } 
}

namespace std
{
    /* For using in std::unordered_* containers */
    template<> struct hash<Crypto::PublicKey>
    {
        size_t operator()(const Crypto::PublicKey &publicKey) const
        {
            return reinterpret_cast<const size_t &>(publicKey);
        }
    };
}
