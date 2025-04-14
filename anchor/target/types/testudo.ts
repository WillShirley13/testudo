/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/testudo.json`.
 */
export type Testudo = {
  "address": "6z68wfurCMYkZG51s1Et9BJEd9nJGUusjHXNt4dGbNNF",
  "metadata": {
    "name": "testudo",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
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
    }
  ],
  "types": [
    {
      "name": "centurion",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
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
            "name": "depositTvl",
            "type": "u64"
          },
          {
            "name": "testudoPdas",
            "type": {
              "vec": "pubkey"
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
          }
        ]
      }
    }
  ]
};
