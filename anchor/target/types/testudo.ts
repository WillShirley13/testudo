/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/testudo.json`.
 */
export type Testudo = {
  "address": "EEDx38FPqWhtj5qDftss355r7tkdD9bWgJFgSfTTi9v6",
  "metadata": {
    "name": "testudo",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
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
          "name": "mint"
        },
        {
          "name": "tokenProgram"
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
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "deleteTestudo",
      "discriminator": [
        220,
        125,
        185,
        47,
        248,
        252,
        238,
        110
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
        }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
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
          "name": "mint",
          "optional": true
        },
        {
          "name": "authorityAta",
          "writable": true,
          "optional": true,
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
          "name": "testudoAta",
          "writable": true,
          "optional": true,
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
          "name": "tokenProgram",
          "optional": true
        },
        {
          "name": "associatedTokenProgram",
          "optional": true,
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
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
      "args": [
        {
          "name": "treasuryAcc",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "legateAdmin",
      "discriminator": [
        187,
        74,
        94,
        95,
        161,
        60,
        54,
        37
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
          "name": "newAuthority",
          "signer": true,
          "optional": true
        },
        {
          "name": "newTreasury",
          "optional": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "action",
          "type": {
            "defined": {
              "name": "legateAdminAction"
            }
          }
        }
      ]
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
          "name": "jupiterProgram"
        }
      ],
      "args": [
        {
          "name": "jupiterData",
          "type": "bytes"
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
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
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
          "name": "backupAccount",
          "optional": true
        },
        {
          "name": "mint",
          "optional": true
        },
        {
          "name": "authorityAta",
          "writable": true,
          "optional": true,
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
          "name": "testudoAta",
          "writable": true,
          "optional": true,
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
          "name": "treasuryAta",
          "writable": true,
          "optional": true,
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
          "name": "backupAta",
          "optional": true
        },
        {
          "name": "tokenProgram",
          "optional": true
        },
        {
          "name": "associatedTokenProgram",
          "optional": true,
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": {
            "option": "u64"
          }
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
      "name": "cannotDecreaseMaxTestudos",
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
      "name": "invalidTokenProgram",
      "msg": "Invalid token program"
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
      "name": "legateAdminAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "updateAuthority",
            "fields": [
              {
                "name": "newAuthority",
                "type": "pubkey"
              }
            ]
          },
          {
            "name": "updateMaxTestudos",
            "fields": [
              {
                "name": "newMax",
                "type": "u16"
              }
            ]
          },
          {
            "name": "updateMaxWhitelistedMints",
            "fields": [
              {
                "name": "newMax",
                "type": "u16"
              }
            ]
          },
          {
            "name": "updateTreasury",
            "fields": [
              {
                "name": "newTreasury",
                "type": "pubkey"
              }
            ]
          },
          {
            "name": "updateFeePercent",
            "fields": [
              {
                "name": "newPercent",
                "type": "u16"
              }
            ]
          },
          {
            "name": "addMintToWhitelist",
            "fields": [
              {
                "name": "mintData",
                "type": {
                  "defined": {
                    "name": "testudoTokenWhitelist"
                  }
                }
              }
            ]
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
