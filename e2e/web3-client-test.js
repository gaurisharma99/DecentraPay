const puppeteer = require('puppeteer-core');
const path = require('path');
const { ethers } = require('ethers');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const APP = 'http://localhost:3000';
const RPC = 'http://127.0.0.1:8545';
const CONTRACT = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const ABI_PATH = path.join(__dirname, '..', 'backend', 'artifacts', 'contracts', 'DecentraPay.sol', 'DecentraPay.json');
const ACCOUNT0 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // sender
const ACCOUNT1 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // receiver

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const abi = require(ABI_PATH).abi;
  const provider = new ethers.JsonRpcProvider(RPC);
  const contract = new ethers.Contract(CONTRACT, abi, provider);
  const beforeCount = Number(await contract.totalPayments());

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  const dialogs = [];
  page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  // Wallet shim (EIP-1193) proxying to the Hardhat node; ethers v5 compatible.
  await page.evaluateOnNewDocument(({ rpcUrl, account }) => {
    const listeners = {};
    window.ethereum = {
      isMetaMask: true,
      selectedAddress: account,
      chainId: '0x7a69',
      on(ev, cb) { (listeners[ev] ||= []).push(cb); },
      removeListener() {},
      async request({ method, params = [] }) {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [account];
        const res = await fetch(rpcUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
        });
        const j = await res.json();
        if (j.error) { const e = new Error(j.error.message); e.code = j.error.code; throw e; }
        return j.result;
      },
    };
  }, { rpcUrl: RPC, account: ACCOUNT0 });

  // Vite keeps an HMR websocket open, so networkidle never settles — use 'load'.
  await page.goto(APP, { waitUntil: 'load', timeout: 45000 });

  // 1. Connect wallet. The app auto-connects when eth_accounts already returns
  // an account (already-authorized), so only click if the button exists.
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((b) => /Connect Wallet/.test(b.textContent)),
    { timeout: 6000 }
  ).catch(() => {});
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Connect Wallet/.test(x.textContent));
    if (b) b.click();
  });
  // Wait for the shortened address to show in the eth card.
  // This app's shortenAddress uses slice(0,5) + last 4, e.g. "0xf39...2266".
  await page.waitForFunction(
    (last4) => document.body.innerText.includes(last4),
    { timeout: 25000 }, ACCOUNT0.slice(-4)
  );
  check('wallet connected and shows shortened address', true, `${ACCOUNT0.slice(0,5)}...${ACCOUNT0.slice(-4)}`);

  // 2. Fill the form and send
  const balBefore = await provider.getBalance(ACCOUNT1);
  await page.type('input[placeholder="Address To"]', ACCOUNT1);
  await page.type('input[placeholder="Amount (ETH)"]', '0.07');
  await page.type('input[placeholder="Enter Message (optional)"]', 'Web3 client E2E');

  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => /Send now/.test(x.textContent)).click();
  });

  // sendTransaction() reloads after the tx; wait for on-chain count to increase
  let seen = false;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    if (Number(await contract.totalPayments()) > beforeCount) { seen = true; break; }
  }
  check('payment recorded on-chain (totalPayments increased)', seen, `${beforeCount} -> ${Number(await contract.totalPayments())}`);

  // 3. UI shows the transaction in history
  await page.waitForFunction(
    (msg) => document.body.innerText.includes(msg),
    { timeout: 25000 }, 'Web3 client E2E'
  ).catch(() => {});
  const bodyText = await page.evaluate(() => document.body.innerText);
  check('transaction message visible in UI history', bodyText.includes('Web3 client E2E'));
  check('amount visible in UI', bodyText.includes('0.07'));

  // 4. Independent on-chain + balance verification
  const all = await contract.fetchAllPayments();
  const last = all[all.length - 1];
  const balAfter = await provider.getBalance(ACCOUNT1);
  check('recorded sender is connected account', last.sender === ACCOUNT0, last.sender);
  check('recorded receiver is target', last.receiver === ACCOUNT1, last.receiver);
  check('recorded amount is 0.07 ETH', ethers.formatEther(last.amount) === '0.07', ethers.formatEther(last.amount));
  check('receiver balance increased by 0.07', balAfter - balBefore === ethers.parseEther('0.07'),
    `+${ethers.formatEther(balAfter - balBefore)} ETH`);
  check('contract holds no funds', (await contract.getContractBalance()) === 0n);
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | ') || 'none');

  await browser.close();
  console.log(`\n${failures === 0 ? 'ALL WEB3-CLIENT CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('WEB3-CLIENT TEST ERROR:', e.message); process.exit(1); });
