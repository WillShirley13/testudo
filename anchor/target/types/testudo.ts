/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/testudo.json`.
 */
export type Testudo = {
  "address": "8ZkK4KPmwwskr2YTjejuHL2sHYyvSmkZauUJY7gyrZ5U",
  "metadata": {
    "name": "testudo",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createTestudo",
      "discriminator": [
        185,
        80,
        13,
        69,
        80,
        88,
        212,
        32
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "centurion"
          ]
        },
        {
          "name": "legate",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  103,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "centurion",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  101,
                  110,
                  116,
                  117,
                  114,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "centurionAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "centurion"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": []
    },
    {
      "name": "depositSol",
      "discriminator": [
        108,
        81,
        78,
        117,
        125,
        155,
        56,
        200
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "centurion"
          ]
        },
        {
          "name": "centurion",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  101,
                  110,
                  116,
                  117,
                  114,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositSpl",
      "discriminator": [
        224,
        0,
        198,
        175,
        198,
        47,
        105,
        204
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "centurion"
          ]
        },
        {
          "name": "authorityAta",
          "writable": true
        },
        {
          "name": "centurion",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  101,
                  110,
                  116,
                  117,
                  114,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "testudo",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initCenturion",
      "discriminator": [
        58,
        133,
        196,
        61,
        206,
        17,
        58,
        64
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "centurion",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  101,
                  110,
                  116,
                  117,
                  114,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "passwordPubkey",
          "type": "pubkey"
        },
        {
          "name": "backupOwner",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "initLegate",
      "discriminator": [
        221,
        211,
        219,
        66,
        207,
        113,
        50,
        227
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "legate",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  103,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "withdrawSol",
      "discriminator": [
        145,
        131,
        74,
        136,
        65,
        137,
        42,
        38
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "centurion"
          ]
        },
        {
          "name": "validSignerOfPassword",
          "signer": true
        },
        {
          "name": "centurion",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  101,
                  110,
                  116,
                  117,
                  114,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "centurion",
      "discriminator": [
        213,
        163,
        239,
        54,
        208,
        69,
        71,
        100
      ]
    },
    {
      "name": "legate",
      "discriminator": [
        25,
        12,
        152,
        251,
        62,
        237,
        26,
        112
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "accountAlreadyInitialized",
      "msg": "Legate account already initialized"
    },
    {
      "code": 6001,
      "name": "invalidAuthority",
      "msg": "Invalid authority passed"
    },
    {
      "code": 6002,
      "name": "testudoCreationCannotPreceedCenturionInitialization",
      "msg": "User's Centurion must be initialized first"
    },
    {
      "code": 6003,
      "name": "unsupportedTokenMint",
      "msg": "Unsupported token mint"
    },
    {
      "code": 6004,
      "name": "insufficientFunds",
      "msg": "Depositer/Withdrawer has insufficient funds for deposit/withdraw"
    },
    {
      "code": 6005,
      "name": "centurionNotInitialized",
      "msg": "Centurion not initialized"
    },
    {
      "code": 6006,
      "name": "invalidTokenMint",
      "msg": "Invalid token mint"
    },
    {
      "code": 6007,
      "name": "invalidAta",
      "msg": "Invalid associated token account"
    },
    {
      "code": 6008,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6009,
      "name": "invalidPasswordSignature",
      "msg": "Invalid signature for password"
    }
  ],
  "types": [
    {
      "name": "centurion",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "backupOwner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "pubkeyToPassword",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "u64"
          },
          {
            "name": "lastAccessed",
            "type": "u64"
          },
          {
            "name": "testudos",
            "type": {
              "vec": {
                "defined": {
                  "name": "testudoData"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "legate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "lastUpdated",
            "type": "u64"
          },
          {
            "name": "maxCenturionsPerUser",
            "type": "u8"
          },
          {
            "name": "maxTestudosPerUser",
            "type": "u16"
          },
          {
            "name": "testudoTokenWhitelist",
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "testudoData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "testudoPubkey",
            "type": "pubkey"
          },
          {
            "name": "testudoBump",
            "type": "u8"
          },
          {
            "name": "testudoTokenCount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
