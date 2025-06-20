/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/testudo.json`.
 */
export type Testudo = {
  "address": "64FiLxaZ3WubhjxdtoQM4CmpXpkbptG8eCok15QJr3bK",
  "metadata": {
    "name": "testudo",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addMintToTestudoTokenWhitelist",
      "discriminator": [
        91,
        215,
        205,
        240,
        164,
        75,
        222,
        213
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "legate"
          ]
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
          "name": "treasury"
        },
        {
          "name": "treasuryAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "mint",
          "type": {
            "defined": {
              "name": "testudoTokenWhitelist"
            }
          }
        }
      ]
    },
    {
      "name": "closeCenturion",
      "discriminator": [
        132,
        146,
        173,
        118,
        189,
        194,
        99,
        31
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
          "name": "treasury",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "closeLegate",
      "discriminator": [
        98,
        41,
        155,
        10,
        219,
        138,
        89,
        161
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "legate"
          ]
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
      "name": "closeTestudo",
      "discriminator": [
        117,
        168,
        179,
        210,
        192,
        53,
        160,
        146
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
          "writable": true,
          "signer": true
        },
        {
          "name": "authorityAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
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
          "name": "testudo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "centurion"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "treasury"
        },
        {
          "name": "treasuryAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
          "name": "amountInLamports",
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
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
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
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "centurion"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
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
          "name": "amountWithDecimals",
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
      "args": [
        {
          "name": "treasuryAcc",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initTestudo",
      "discriminator": [
        4,
        226,
        177,
        42,
        77,
        155,
        94,
        135
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
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "centurion"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "mint"
        }
      ],
      "args": []
    },
    {
      "name": "swap",
      "discriminator": [
        248,
        198,
        158,
        145,
        225,
        117,
        135,
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
          "name": "sourceTestudo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "centurion"
              },
              {
                "kind": "account",
                "path": "sourceMint"
              }
            ]
          }
        },
        {
          "name": "destinationTestudo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "centurion"
              },
              {
                "kind": "account",
                "path": "destinationMint"
              }
            ]
          }
        },
        {
          "name": "sourceMint"
        },
        {
          "name": "destinationMint"
        },
        {
          "name": "treasury"
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
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "jupiterProgram"
        }
      ],
      "args": [
        {
          "name": "jupiterSwap",
          "type": {
            "defined": {
              "name": "jupiterInstructionWithIdxs"
            }
          }
        },
        {
          "name": "jupiterSetup",
          "type": {
            "vec": {
              "defined": {
                "name": "jupiterInstructionWithIdxs"
              }
            }
          }
        },
        {
          "name": "jupiterCleanup",
          "type": {
            "defined": {
              "name": "jupiterInstructionWithIdxs"
            }
          }
        },
        {
          "name": "testudoData",
          "type": {
            "vec": {
              "defined": {
                "name": "testudoData"
              }
            }
          }
        }
      ]
    },
    {
      "name": "updateAuthority",
      "discriminator": [
        32,
        46,
        64,
        28,
        149,
        75,
        243,
        88
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "legate"
          ]
        },
        {
          "name": "newAuthority",
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
        }
      ],
      "args": []
    },
    {
      "name": "updateBackUpAccount",
      "discriminator": [
        238,
        120,
        102,
        92,
        157,
        240,
        77,
        118
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
        }
      ],
      "args": [
        {
          "name": "backupAccount",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateFeePercent",
      "discriminator": [
        13,
        225,
        121,
        54,
        23,
        94,
        253,
        17
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "legate"
          ]
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
        }
      ],
      "args": [
        {
          "name": "newFeePercent",
          "type": "u16"
        }
      ]
    },
    {
      "name": "updateMaxTestudos",
      "discriminator": [
        183,
        108,
        192,
        5,
        181,
        251,
        228,
        2
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "legate"
          ]
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
        }
      ],
      "args": [
        {
          "name": "newMaxTestudos",
          "type": "u16"
        }
      ]
    },
    {
      "name": "updateMaxWhitelistedMints",
      "discriminator": [
        202,
        184,
        37,
        142,
        189,
        21,
        26,
        193
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "legate"
          ]
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
      "args": [
        {
          "name": "newMaxWhitelistedMints",
          "type": "u16"
        }
      ]
    },
    {
      "name": "updateTreasury",
      "discriminator": [
        60,
        16,
        243,
        66,
        96,
        59,
        254,
        131
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "legate"
          ]
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
        }
      ],
      "args": [
        {
          "name": "newTreasury",
          "type": "pubkey"
        }
      ]
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
          "name": "treasury",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amountInLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawSolToBackup",
      "discriminator": [
        254,
        230,
        17,
        116,
        161,
        54,
        93,
        145
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
          "name": "backupAccount",
          "writable": true
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
          "name": "treasury",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "withdrawSpl",
      "discriminator": [
        181,
        154,
        94,
        86,
        62,
        115,
        6,
        186
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
          "name": "authorityAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
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
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "centurion"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
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
          "name": "treasury"
        },
        {
          "name": "treasuryAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
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
      "args": [
        {
          "name": "amountWithDecimals",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawToBackup",
      "discriminator": [
        36,
        27,
        114,
        22,
        47,
        242,
        235,
        148
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
          "name": "testudo",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "centurion"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "backupAccount",
          "writable": true
        },
        {
          "name": "backupAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "backupAccount"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "mint",
          "writable": true
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
          "name": "treasury"
        },
        {
          "name": "treasuryAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
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
      "msg": "Account already initialized"
    },
    {
      "code": 6001,
      "name": "legateNotInitialized",
      "msg": "Legate account not initialized"
    },
    {
      "code": 6002,
      "name": "invalidAuthority",
      "msg": "Invalid authority passed"
    },
    {
      "code": 6003,
      "name": "testudoCreationCannotPreceedCenturionInitialization",
      "msg": "User's Centurion must be initialized first"
    },
    {
      "code": 6004,
      "name": "unsupportedTokenMint",
      "msg": "Unsupported token mint. Legate must whitelist the token mint before Testudo creation"
    },
    {
      "code": 6005,
      "name": "insufficientFunds",
      "msg": "Depositer/Withdrawer has insufficient funds for deposit/withdraw"
    },
    {
      "code": 6006,
      "name": "centurionNotInitialized",
      "msg": "Centurion not initialized"
    },
    {
      "code": 6007,
      "name": "invalidTokenMint",
      "msg": "Invalid token mint"
    },
    {
      "code": 6008,
      "name": "invalidAta",
      "msg": "Invalid associated token account"
    },
    {
      "code": 6009,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6010,
      "name": "invalidPasswordSignature",
      "msg": "Invalid signature for password"
    },
    {
      "code": 6011,
      "name": "mintAlreadyInList",
      "msg": "Mint already in list"
    },
    {
      "code": 6012,
      "name": "noBackupAccountStored",
      "msg": "No backup account stored"
    },
    {
      "code": 6013,
      "name": "invalidBackupAccount",
      "msg": "Invalid backup account passed"
    },
    {
      "code": 6014,
      "name": "maxTestudosReached",
      "msg": "Max testudos reached"
    },
    {
      "code": 6015,
      "name": "cannotUpdateMaxTestudosToLessThanCurrentNumberOfTestudos",
      "msg": "Cannot update max testudos to less than current number of testudos"
    },
    {
      "code": 6016,
      "name": "maxWhitelistedMintsReached",
      "msg": "Max whitelisted mints reached"
    },
    {
      "code": 6017,
      "name": "cannotUpdateMaxWhitelistedMintsToLessThanCurrentNumberOfWhitelistedMints",
      "msg": "Cannot update max whitelisted mints to less than current number of whitelisted mints"
    },
    {
      "code": 6018,
      "name": "errorTransferringAllTokensOutOfTestudo",
      "msg": "Error while transferring all tokens out of Testudo"
    },
    {
      "code": 6019,
      "name": "invalidTreasuryAccount",
      "msg": "Invalid treasury account"
    },
    {
      "code": 6020,
      "name": "centurionNotEmptyOfSplTokens",
      "msg": "Centurion must be empty of spl tokens before closing (no testudos remaining)"
    },
    {
      "code": 6021,
      "name": "invalidRemainingAccounts",
      "msg": "Invalid remaining accounts given"
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
            "name": "lamportBalance",
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
      "name": "jupiterInstructionWithIdxs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "programId",
            "type": "pubkey"
          },
          {
            "name": "accountsIdxs",
            "type": "bytes"
          },
          {
            "name": "data",
            "type": "bytes"
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
            "name": "maxWhitelistedMints",
            "type": "u16"
          },
          {
            "name": "treasuryAcc",
            "type": "pubkey"
          },
          {
            "name": "percentForFees",
            "type": "u16"
          },
          {
            "name": "testudoTokenWhitelist",
            "type": {
              "vec": {
                "defined": {
                  "name": "testudoTokenWhitelist"
                }
              }
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
          }
        ]
      }
    },
    {
      "name": "testudoTokenWhitelist",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "tokenName",
            "type": "string"
          },
          {
            "name": "tokenSymbol",
            "type": "string"
          },
          {
            "name": "tokenDecimals",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
