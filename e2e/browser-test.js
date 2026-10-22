const puppeteer = require('puppeteer-core');
const path = require('path');
const { ethers } = require('ethers');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://localhost:5173';
const RPC = 'http://127.0.0.1:8545';
const CONTRACT = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const ABI_PATH = process.env.ABI_PATH || path.join(__dirname, '..', 'backend', 'artifacts', 'contracts', 'DecentraPay.sol', 'DecentraPay.json');
const SHOT_PATH = process.env.SHOT_PATH || path.join(__dirname, 'screenshot.png');
const ACCOUNT0 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // sender (connected)
const ACCOUNT1 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // receiver
// Demo credentials — MUST match frontend/src/utils/credentials.js (that file is an
// ES module, so we can't require() it from this CommonJS harness).
const DEMO_USER = 'admin';
const DEMO_PASS = 'decentrapay2026';

const rpc = async (method, params = []) => {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await res.json();
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result;
};

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures++;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const abi = require(ABI_PATH).abi;

  // Snapshot on-chain state BEFORE the UI test
  const provider = new ethers.JsonRpcProvider(RPC);
  const before = {
    count: Number(await (new ethers.Contract(CONTRACT, abi, provider)).totalPayments()),
    balance: await provider.getBalance(ACCOUNT1),
  };

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();

  const dialogs = [];
  page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  // Inject an EIP-1193 wallet shim BEFORE any page script runs.
  // It proxies JSON-RPC to the Hardhat node (which signs with unlocked accounts),
  // so the real app code path (BrowserProvider -> signer -> contract) is exercised.
  await page.evaluateOnNewDocument(({ rpcUrl, account }) => {
    window.__rpcLog = [];
    const listeners = {};
    window.ethereum = {
      isMetaMask: true,
      selectedAddress: account,
      chainId: '0x7a69',
      on(ev, cb) { (listeners[ev] ||= []).push(cb); },
      removeListener() {},
      removeMetaMask() {},
      async request({ method, params = [] }) {
        window.__rpcLog.push(method);
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [account];
        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
        });
        const j = await res.json();
        if (j.error) { const e = new Error(j.error.message); e.code = j.error.code; throw e; }
        return j.result;
      },
    };
  }, { rpcUrl: RPC, account: ACCOUNT0 });

  await page.goto(APP, { waitUntil: 'networkidle2', timeout: 30000 });

  // 0. Demo login gate (see frontend/src/utils/credentials.js)
  await page.waitForSelector('input[placeholder="Enter username"]', { timeout: 15000 });

  // 0a. Wrong credentials must be rejected (app stays gated)
  await page.type('input[placeholder="Enter username"]', 'admin');
  await page.type('input[placeholder="Enter password"]', 'wrong-password');
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /^Login$/.test(x.textContent.trim()));
    b.click();
  });
  await page.waitForFunction(
    () => /Invalid username or password/i.test(document.body.innerText),
    { timeout: 8000 }
  );
  const stillGated = await page.evaluate(
    () => !!document.querySelector('input[placeholder="Enter username"]')
  );
  check('demo login rejects wrong password', stillGated);

  // 0b. Correct credentials reveal the app
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[placeholder="Enter username"], input[placeholder="Enter password"]');
    inputs.forEach((i) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(i, '');
      i.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
  await page.type('input[placeholder="Enter username"]', DEMO_USER);
  await page.type('input[placeholder="Enter password"]', DEMO_PASS);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /^Login$/.test(x.textContent.trim()));
    b.click();
  });
  // Login form should disappear and the main app render
  await page.waitForFunction(
    () => !document.querySelector('input[placeholder="Enter username"]') && !!document.querySelector('input[placeholder^="Receiver"]'),
    { timeout: 15000 }
  );
  check('demo login gate admits valid credentials and reveals app', true, `${DEMO_USER} / ****`);

  // 1. Connect wallet. The app auto-connects when eth_accounts already returns
  // an account (already-authorized wallet), so only click if the button exists.
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((b) => /Connect Wallet/.test(b.textContent)),
    { timeout: 8000 }
  ).catch(() => {});
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Connect Wallet/.test(x.textContent));
    if (b) b.click();
  });
  await page.waitForFunction(
    (addr) => document.body.innerText.includes(addr.slice(0, 6)) && document.body.innerText.includes(addr.slice(-4)),
    { timeout: 15000 }, ACCOUNT0
  );
  check('wallet connects and navbar shows status', true, `shortened ${ACCOUNT0.slice(0,6)}...${ACCOUNT0.slice(-4)}`);

  // 2. Fill the form and send
  await page.type('input[placeholder^="Receiver"]', ACCOUNT1);
  await page.type('input[placeholder^="Amount"]', '0.05');
  await page.type('input[placeholder^="Message"]', 'E2E browser payment');

  const balanceBeforeSend = await provider.getBalance(ACCOUNT1);

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Send Payment/.test(x.textContent));
    b.click();
  });

  // 3. Wait for the new payment to appear in on-chain history in the UI
  await page.waitForFunction(
    (msg) => document.body.innerText.includes(msg),
    { timeout: 30000 }, 'E2E browser payment'
  );
  check('payment appears in on-chain history in the UI', true);

  // History section should show sender/receiver/amount
  const bodyText = await page.evaluate(() => document.body.innerText);
  check('history shows amount', bodyText.includes('0.05'));
  check('no blocking alert dialogs', dialogs.length === 0, dialogs.join(' | ') || 'none');

  await page.screenshot({ path: SHOT_PATH, fullPage: true });

  // 4. Verify on-chain truth (independent of the UI)
  const contract = new ethers.Contract(CONTRACT, abi, provider);
  const count = Number(await contract.totalPayments());
  const all = await contract.fetchAllPayments();
  const last = all[all.length - 1];
  const balanceAfterSend = await provider.getBalance(ACCOUNT1);

  check('on-chain totalPayments incremented', count === before.count + 1, `${before.count} -> ${count}`);
  check('recorded sender is connected account', last.sender === ACCOUNT0, last.sender);
  check('recorded receiver is target', last.receiver === ACCOUNT1, last.receiver);
  check('recorded message matches', last.message === 'E2E browser payment', last.message);
  check('recorded amount is 0.05 ETH', ethers.formatEther(last.amount) === '0.05', ethers.formatEther(last.amount));
  check('receiver balance actually increased by 0.05', balanceAfterSend - balanceBeforeSend === ethers.parseEther('0.05'),
    `+${ethers.formatEther(balanceAfterSend - balanceBeforeSend)} ETH`);
  check('contract holds no funds', (await contract.getContractBalance()) === 0n);
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | ') || 'none');

  // 5. Contract validation surfaces through the UI (self-payment)
  await page.type('input[placeholder^="Receiver"]', ACCOUNT0);
  await page.type('input[placeholder^="Amount"]', '0.01');
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Send Payment/.test(x.textContent));
    b.click();
  });
  await sleep(1500);
  check('self-payment blocked with alert', dialogs.some((d) => /cannot send.*yourself/i.test(d)), dialogs.join(' | '));

  await browser.close();

  console.log(`\n${failures === 0 ? 'ALL BROWSER CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('E2E ERROR:', e.message); process.exit(1); });
