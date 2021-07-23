// Copyright (c) 2012-2017, The CryptoNote developers, The Bytecoin developers
// Copyright (c) 2014-2018, The Monero Project
// Copyright (c) 2014-2018, The Aeon Project
// Copyright (c) 2018, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

#pragma once

#include <stddef.h>

#include "CryptoTypes.h"

#pragma pack(push, 1)
union hash_state
{
    uint8_t b[200];
    uint64_t w[25];
};
#pragma pack(pop)

static_assert(sizeof(union hash_state) == 200, "Invalid structure size");

namespace Crypto
{
    void cn_fast_hash(const void *data, size_t length, char *hash);

    void cn_fast_hash(const void *data, size_t length, Hash &hash);

    Hash cn_fast_hash(const void *data, size_t length);
}
