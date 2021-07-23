// Copyright (c) 2012-2017, The CryptoNote developers, The Bytecoin developers
// Copyright (c) 2014-2018, The Monero Project
// Copyright (c) 2016-2018, The Karbowanec developers
// Copyright (c) 2018, The TurtleCoin Developers
// 
// Please see the included LICENSE file for more information.

#include "crypto.h"
#include "hash.h"
#include "Varint.h"
#include "random.h"

namespace Crypto
{
    inline void random_scalar(EllipticCurveScalar &res)
    {
        unsigned char tmp[64];
        Random::randomBytes(64, tmp);
        sc_reduce(tmp);
        memcpy(&res, tmp, 32);
    }

    inline void hash_to_scalar(
        const void *data,
        const size_t length,
        EllipticCurveScalar &res)
    {
        cn_fast_hash(data, length, reinterpret_cast<Hash &>(res));
        sc_reduce32(reinterpret_cast<unsigned char*>(&res));
    }

    bool generate_key_derivation(
        const PublicKey &key1,
        const SecretKey &key2,
        KeyDerivation &derivation)
    {
        ge_p3 point;
        ge_p2 point2;
        ge_p1p1 point3;

        if (ge_frombytes_vartime(&point, reinterpret_cast<const unsigned char*>(&key1)) != 0)
        {
            return false;
        }

        ge_scalarmult(&point2, reinterpret_cast<const unsigned char*>(&key2), &point);
        ge_mul8(&point3, &point2);
        ge_p1p1_to_p2(&point2, &point3);
        ge_tobytes(reinterpret_cast<unsigned char*>(&derivation), &point2);
        return true;
    }

    void derivation_to_scalar(
        const KeyDerivation &derivation,
        size_t output_index,
        EllipticCurveScalar &res)
    {
        struct
        {
            KeyDerivation derivation;
            char output_index[(sizeof(size_t) * 8 + 6) / 7];
        } buf;

        char *end = buf.output_index;
        buf.derivation = derivation;
        Tools::write_varint(end, output_index);
        hash_to_scalar(&buf, end - reinterpret_cast<char *>(&buf), res);
    }

    bool derive_public_key(
        const KeyDerivation &derivation,
        const size_t output_index,
        const PublicKey &base,
        PublicKey &derived_key)
    {
        EllipticCurveScalar scalar;
        ge_p3 point1;
        ge_p3 point2;
        ge_cached point3;
        ge_p1p1 point4;
        ge_p2 point5;
        if (ge_frombytes_vartime(&point1, reinterpret_cast<const unsigned char*>(&base)) != 0) {
          return false;
        }
        derivation_to_scalar(derivation, output_index, scalar);
        ge_scalarmult_base(&point2, reinterpret_cast<unsigned char*>(&scalar));
        ge_p3_to_cached(&point3, &point2);
        ge_add(&point4, &point1, &point3);
        ge_p1p1_to_p2(&point5, &point4);
        ge_tobytes(reinterpret_cast<unsigned char*>(&derived_key), &point5);
        return true;
    }

    void derive_secret_key(
        const KeyDerivation &derivation,
        const size_t output_index,
        const SecretKey &base,
        SecretKey &derived_key)
    {
        EllipticCurveScalar scalar;
        derivation_to_scalar(derivation, output_index, scalar);

        sc_add(
            reinterpret_cast<unsigned char*>(&derived_key),
            reinterpret_cast<const unsigned char*>(&base),
            reinterpret_cast<unsigned char*>(&scalar)
        );
    }

    bool underive_public_key(
        const KeyDerivation &derivation,
        const size_t output_index,
        const PublicKey &derived_key,
        PublicKey &base)
    {
        EllipticCurveScalar scalar;
        ge_p3 point1;
        ge_p3 point2;
        ge_cached point3;
        ge_p1p1 point4;
        ge_p2 point5;
        if (ge_frombytes_vartime(&point1, reinterpret_cast<const unsigned char*>(&derived_key)) != 0) {
          return false;
        }
        derivation_to_scalar(derivation, output_index, scalar);
        ge_scalarmult_base(&point2, reinterpret_cast<unsigned char*>(&scalar));
        ge_p3_to_cached(&point3, &point2);
        ge_sub(&point4, &point1, &point3);
        ge_p1p1_to_p2(&point5, &point4);
        ge_tobytes(reinterpret_cast<unsigned char*>(&base), &point5);
        return true;
    }

    void hash_to_ec(
        const PublicKey &key,
        ge_p3 &res)
    {
        Hash h;
        ge_p2 point;
        ge_p1p1 point2;
        cn_fast_hash(std::addressof(key), sizeof(PublicKey), h);
        ge_fromfe_frombytes_vartime(&point, reinterpret_cast<const unsigned char *>(&h));
        ge_mul8(&point2, &point);
        ge_p1p1_to_p3(&res, &point2);
    }

    void generate_key_image(
        const PublicKey &pub,
        const SecretKey &sec,
        KeyImage &image)
    {
        ge_p3 point;
        ge_p2 point2;
        hash_to_ec(pub, point);
        ge_scalarmult(&point2, reinterpret_cast<const unsigned char*>(&sec), &point);
        ge_tobytes(reinterpret_cast<unsigned char*>(&image), &point2);
    }
  
    struct rs_comm
    {
        Hash h;
        struct
        {
            EllipticCurvePoint a, b;
        } ab[];
    };

    inline size_t rs_comm_size(size_t pubs_count)
    {
        return sizeof(rs_comm) + pubs_count * sizeof(((rs_comm*)0)->ab[0]);
    }

    std::tuple<bool, std::vector<Signature>> generateRingSignatures(
        const Hash prefixHash,
        const KeyImage keyImage,
        const std::vector<PublicKey> publicKeys,
        const Crypto::SecretKey transactionSecretKey,
        uint64_t realOutput)
    {
        std::vector<Signature> signatures(publicKeys.size());

        ge_p3 image_unp;
        ge_dsmp image_pre;
        EllipticCurveScalar sum, k, h;

        rs_comm *const buf = reinterpret_cast<rs_comm *>(alloca(rs_comm_size(publicKeys.size())));

        if (ge_frombytes_vartime(&image_unp, reinterpret_cast<const unsigned char*>(&keyImage)) != 0)
        {
            return {false, signatures};
        }

        ge_dsm_precomp(image_pre, &image_unp);

        sc_0(reinterpret_cast<unsigned char*>(&sum));

        buf->h = prefixHash;

        for (size_t i = 0; i < publicKeys.size(); i++)
        {
            ge_p2 tmp2;
            ge_p3 tmp3;

            if (i == realOutput)
            {
                random_scalar(k);
                ge_scalarmult_base(&tmp3, reinterpret_cast<unsigned char*>(&k));
                ge_p3_tobytes(reinterpret_cast<unsigned char*>(&buf->ab[i].a), &tmp3);
                hash_to_ec(publicKeys[i], tmp3);
                ge_scalarmult(&tmp2, reinterpret_cast<unsigned char*>(&k), &tmp3);
                ge_tobytes(reinterpret_cast<unsigned char*>(&buf->ab[i].b), &tmp2);
            }
            else
            {
                random_scalar(reinterpret_cast<EllipticCurveScalar&>(signatures[i]));
                random_scalar(*reinterpret_cast<EllipticCurveScalar*>(reinterpret_cast<unsigned char*>(&signatures[i]) + 32));

                if (ge_frombytes_vartime(&tmp3, reinterpret_cast<const unsigned char*>(&publicKeys[i])) != 0)
                {
                    return {false, signatures};
                }

                ge_double_scalarmult_base_vartime(
                    &tmp2,
                    reinterpret_cast<unsigned char*>(&signatures[i]),
                    &tmp3,
                    reinterpret_cast<unsigned char*>(&signatures[i]) + 32
                );

                ge_tobytes(reinterpret_cast<unsigned char*>(&buf->ab[i].a), &tmp2);

                hash_to_ec(publicKeys[i], tmp3);

                ge_double_scalarmult_precomp_vartime(
                    &tmp2,
                    reinterpret_cast<unsigned char*>(&signatures[i]) + 32,
                    &tmp3,
                    reinterpret_cast<unsigned char*>(&signatures[i]),
                    image_pre
                );

                ge_tobytes(reinterpret_cast<unsigned char*>(&buf->ab[i].b), &tmp2);

                sc_add(
                    reinterpret_cast<unsigned char*>(&sum),
                    reinterpret_cast<unsigned char*>(&sum),
                    reinterpret_cast<unsigned char*>(&signatures[i])
                );
            }
        }

        hash_to_scalar(buf, rs_comm_size(publicKeys.size()), h);

        sc_sub(
            reinterpret_cast<unsigned char*>(&signatures[realOutput]),
            reinterpret_cast<unsigned char*>(&h),
            reinterpret_cast<unsigned char*>(&sum)
        );

        sc_mulsub(
            reinterpret_cast<unsigned char*>(&signatures[realOutput]) + 32,
            reinterpret_cast<unsigned char*>(&signatures[realOutput]),
            reinterpret_cast<const unsigned char*>(&transactionSecretKey),
            reinterpret_cast<unsigned char*>(&k)
        );

        return {true, signatures};
    }

    bool checkRingSignature(
        const Hash &prefix_hash,
        const KeyImage &image,
        const std::vector<PublicKey> pubs,
        const std::vector<Signature> signatures)
    {
        ge_p3 image_unp;

        ge_dsmp image_pre;

        EllipticCurveScalar sum, h;

        rs_comm *const buf = reinterpret_cast<rs_comm *>(alloca(rs_comm_size(pubs.size())));

        if (ge_frombytes_vartime(&image_unp, reinterpret_cast<const unsigned char*>(&image)) != 0)
        {
            return false;
        }

        ge_dsm_precomp(image_pre, &image_unp);

        if (ge_check_subgroup_precomp_vartime(image_pre) != 0)
        {
            return false;
        }

        sc_0(reinterpret_cast<unsigned char*>(&sum));

        buf->h = prefix_hash;

        for (size_t i = 0; i < pubs.size(); i++)
        {
            ge_p2 tmp2;
            ge_p3 tmp3;

            if (sc_check(reinterpret_cast<const unsigned char*>(&signatures[i])) != 0 
             || sc_check(reinterpret_cast<const unsigned char*>(&signatures[i]) + 32) != 0)
            {
                return false;
            }

            if (ge_frombytes_vartime(&tmp3, reinterpret_cast<const unsigned char*>(&pubs[i])) != 0)
            {
                return false;
            }

            ge_double_scalarmult_base_vartime(
                &tmp2,
                reinterpret_cast<const unsigned char*>(&signatures[i]),
                &tmp3,
                reinterpret_cast<const unsigned char*>(&signatures[i]) + 32
            );

            ge_tobytes(reinterpret_cast<unsigned char*>(&buf->ab[i].a), &tmp2);

            hash_to_ec(pubs[i], tmp3);

            ge_double_scalarmult_precomp_vartime(
                &tmp2,
                reinterpret_cast<const unsigned char*>(&signatures[i]) + 32,
                &tmp3,
                reinterpret_cast<const unsigned char*>(&signatures[i]),
                image_pre
            );

            ge_tobytes(reinterpret_cast<unsigned char*>(&buf->ab[i].b), &tmp2);

            sc_add(
                reinterpret_cast<unsigned char*>(&sum),
                reinterpret_cast<unsigned char*>(&sum),
                reinterpret_cast<const unsigned char*>(&signatures[i])
            );
        }

        hash_to_scalar(buf, rs_comm_size(pubs.size()), h);

        sc_sub(
            reinterpret_cast<unsigned char*>(&h),
            reinterpret_cast<unsigned char*>(&h),
            reinterpret_cast<unsigned char*>(&sum)
        );

        return sc_isnonzero(reinterpret_cast<unsigned char*>(&h)) == 0;
    }
}
