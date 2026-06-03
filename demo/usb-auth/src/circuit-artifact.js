const circuit = {
  "noir_version": "0.33.0+325dac54efb6f99201de9fdeb0a507d45189607d",
  "hash": 12814149799798860000,
  "abi": {
    "parameters": [
      {
        "name": "device_secret",
        "type": {
          "kind": "field"
        },
        "visibility": "private"
      },
      {
        "name": "usb_serial",
        "type": {
          "kind": "field"
        },
        "visibility": "public"
      },
      {
        "name": "commitment",
        "type": {
          "kind": "field"
        },
        "visibility": "public"
      },
      {
        "name": "challenge",
        "type": {
          "kind": "field"
        },
        "visibility": "public"
      },
      {
        "name": "user_id_hash",
        "type": {
          "kind": "field"
        },
        "visibility": "public"
      }
    ],
    "return_type": {
      "abi_type": {
        "kind": "field"
      },
      "visibility": "public"
    },
    "error_types": {}
  },
  "bytecode": "H4sIAAAAAAAA/62T3QrDIAxGTX+210mM1uRurzKZff9H2GCRluJd84EERA6Jh0D45/k7czgCVl9W8V6oc6cLl3FLqZXYiOmNUatkTLluQkJZ8icKc5MkRasWVErcaM/Ku4Enxx4XPxaO/vDurMEceXMfznP3LM59giPL0TWtjixPF3ByAAMvYPs4211/s4ZBvqWD4XIpBAAA",
  "debug_symbols": "NYxbCoAgEEX3Mt99VBSRW4mIqSwEGcVHEOLeG4v+7rmvBLtc47koOowHMSXQZsOgDDElqF/LW6RCPqALILpmrEDSzqpvcwWH0hJEP+SZ4UKncNWyzEsWafvfGMNtv4S7Dw==",
  "file_map": {
    "57": {
      "source": "fn main(\n    device_secret: Field,\n    usb_serial: pub Field,\n    commitment: pub Field,\n    challenge: pub Field,\n    user_id_hash: pub Field,\n) -> pub Field {\n    // The proof is bound to the hardware serial because it is a public input.\n    // We can also incorporate it into the commitment check for stronger binding if needed.\n    let computed_commitment = device_secret * device_secret + user_id_hash;\n    assert(computed_commitment == commitment);\n\n    device_secret * challenge + user_id_hash + usb_serial\n}\n",
      "path": "/src/main.nr"
    }
  },
  "names": [
    "main"
  ]
};

export default circuit;
