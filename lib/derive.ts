import * as bitcoin from "bitcoinjs-lib";
import * as bip32Factory from "bip32";
import * as ecc from "tiny-secp256k1";

const bip32 = bip32Factory.BIP32Factory(ecc);

const NETWORK =
  (process.env.BTC_NETWORK || "testnet").toLowerCase() === "testnet"
    ? bitcoin.networks.testnet
    : bitcoin.networks.bitcoin;

const XPUB = process.env.BTC_XPUB_TESTNET;

if (!XPUB && process.env.BTC_NETWORK !== "mainnet") {
  console.warn(
    "⚠️ BTC_XPUB_TESTNET not set. On-chain fallback will be disabled."
  );
}

export function deriveP2WPKHAddressFromXpub(index: number) {
  if (!XPUB) throw new Error("BTC_XPUB_TESTNET is not configured");

  // Parse the tpub (testnet XPUB)
  const node = bip32.fromBase58(XPUB, NETWORK);

  // Derive external chain: m/.../0/index
  const child = node.derive(0).derive(index);

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
    network: NETWORK,
  });

  if (!address) throw new Error("Failed to derive address");
  return address;
}
