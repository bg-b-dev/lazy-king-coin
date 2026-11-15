// Usage: node launch.mjs          upload metadata, build, sign and simulate only
//        node launch.mjs --send   also send the create transaction
import { readFileSync } from 'node:fs';
import { Connection, Keypair, VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

const RPC = process.env.SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com';
const FIRST_BUY_SOL = 0.01;
const MAX_SPEND_SOL = 0.05;
const send = process.argv.includes('--send');

const coin = {
  name: 'Lazy King',
  symbol: 'LAZY',
  website: 'https://make.fun/bounty/makefun-coin-promo-01',
  description: readFileSync(new URL('./coin/description.txt', import.meta.url), 'utf8').trim(),
};
if (!coin.description.includes('make.fun/bounty/makefun-coin-promo-01')) throw new Error('description lacks the bounty link');

const wallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(new URL('./wallet.json', import.meta.url), 'utf8'))));
const mint = Keypair.generate();
const conn = new Connection(RPC, 'confirmed');

// pump.fun's IPFS upload sits behind a browser challenge, so the metadata is hosted in this repo, pinned to a commit.
const metadataUri = process.argv.find((a) => a.startsWith('https://'));
if (!metadataUri) throw new Error('pass the metadata.json URL');
const meta = await (await fetch(metadataUri)).json();
for (const k of ['name', 'symbol', 'description', 'website']) {
  if (meta[k] !== coin[k]) throw new Error(`hosted metadata ${k} differs from the local coin`);
}
const img = await fetch(meta.image);
if (!img.ok || !img.headers.get('content-type')?.startsWith('image/')) throw new Error(`image does not read: ${meta.image}`);
console.log('metadataUri', metadataUri);

const res = await fetch('https://pumpportal.fun/api/trade-local', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    publicKey: wallet.publicKey.toBase58(),
    action: 'create',
    tokenMetadata: { name: coin.name, symbol: coin.symbol, uri: metadataUri },
    mint: mint.publicKey.toBase58(),
    denominatedInSol: 'true',
    amount: FIRST_BUY_SOL,
    slippage: 10,
    priorityFee: 0.0005,
    pool: 'pump',
  }),
});
if (!res.ok) throw new Error(`trade-local ${res.status}: ${await res.text()}`);
const tx = VersionedTransaction.deserialize(new Uint8Array(await res.arrayBuffer()));
tx.sign([mint, wallet]);

const before = await conn.getBalance(wallet.publicKey);
const sim = await conn.simulateTransaction(tx, {
  sigVerify: true,
  accounts: { encoding: 'base64', addresses: [wallet.publicKey.toBase58()] },
});
if (sim.value.err) throw new Error(`simulation failed: ${JSON.stringify(sim.value.err)}\n${sim.value.logs?.join('\n')}`);
const spend = (before - sim.value.accounts[0].lamports) / LAMPORTS_PER_SOL;
console.log('wallet', wallet.publicKey.toBase58(), 'balance', before / LAMPORTS_PER_SOL, 'simulated spend', spend);
if (spend > MAX_SPEND_SOL) throw new Error(`spend ${spend} SOL is over the ${MAX_SPEND_SOL} SOL limit`);
if (!send) process.exit(0);

const signature = await conn.sendRawTransaction(tx.serialize(), { maxRetries: 5 });
const { lastValidBlockHeight } = await conn.getLatestBlockhash();
const conf = await conn.confirmTransaction({ signature, blockhash: tx.message.recentBlockhash, lastValidBlockHeight }, 'confirmed');
if (conf.value.err) throw new Error(`create failed: ${JSON.stringify(conf.value.err)} ${signature}`);
console.log(JSON.stringify({ mint: mint.publicKey.toBase58(), create_signature: signature }, null, 2));
