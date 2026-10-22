const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const APP = 'http://localhost:5173';
const RPC = 'http://127.0.0.1:8545';
const ACCOUNT0 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const DEMO_USER = 'admin';
const DEMO_PASS = 'decentrapay2026';

// The chain the shim PRETENDS MetaMask is on (Ethereum mainnet = 0x1).
const WRONG_CHAIN_HEX = '0x1';
const WRONG_CHAIN_DEC = 1;

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures++;
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  const dialogs = [];
  page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  // Wallet shim stuck on the WRONG network, and it records switch attempts.
  await page.evaluateOnNewDocument(({ rpcUrl, account, wrongChain }) => {
    window.__switchCalls = [];
    const listeners = {};
    window.ethereum = {
      isMetaMask: true,
      selectedAddress: account,
      chainId: wrongChain,
      on(ev, cb) { (listeners[ev] ||= []).push(cb); },
      removeListener() {},
      async request({ method, params = [] }) {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [account];
        if (method === 'eth_chainId') return window.ethereum.chainId;
        if (method === 'wallet_switchEthereumChain') {
          window.__switchCalls.push({ method, params });
          const target = params?.[0]?.chainId;
          window.ethereum.chainId = target;
          // MetaMask fires chainChanged on a successful switch
          (listeners.chainChanged || []).forEach((cb) => cb(target));
          return null;
        }
        if (method === 'wallet_addEthereumChain') {
          window.__switchCalls.push({ method, params });
          return null;
        }
        const res = await fetch(rpcUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        });
        const j = await res.json();
        if (j.error) { const e = new Error(j.error.message); e.code = j.error.code; throw e; }
        return j.result;
      },
    };
  }, { rpcUrl: RPC, account: ACCOUNT0, wrongChain: WRONG_CHAIN_HEX });

  await page.goto(APP, { waitUntil: 'networkidle2', timeout: 30000 });
  // Login through the demo gate
  await page.waitForSelector('input[placeholder="Enter username"]', { timeout: 15000 });
  await page.type('input[placeholder="Enter username"]', DEMO_USER);
  await page.type('input[placeholder="Enter password"]', DEMO_PASS);
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => /^Login$/.test(x.textContent.trim())).click();
  });
  await page.waitForFunction(
    () => !!document.querySelector('input[placeholder^="Receiver"]'),
    { timeout: 15000 }
  );

  // 1. Wrong-network banner should be visible
  await page.waitForFunction(
    () => /Wrong network/i.test(document.body.innerText),
    { timeout: 10000 }
  ).catch(() => {});
  const bannerShown = await page.evaluate(() => /Wrong network/i.test(document.body.innerText));
  check('wrong-network banner is shown', bannerShown);

  // 2. Hero send button should offer a switch, not "Send Payment"
  const btnText = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Switch to Hardhat Network|Send Payment/.test(x.textContent));
    return b ? b.textContent.trim() : '(none)';
  });
  check('hero button offers network switch', /Switch to Hardhat Network/.test(btnText), btnText);

  // 3. Sending is blocked on the wrong network (no payment recorded)
  const beforeCount = await page.evaluate(async () => {
    const res = await fetch('http://127.0.0.1:8545', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
    });
    return (await res.json()).result;
  });

  // 4. Click the banner's "Switch network" — it must call wallet_switchEthereumChain
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Switch network/.test(x.textContent));
    b.click();
  });
  await page.waitForFunction(
    () => window.__switchCalls.length > 0,
    { timeout: 8000 }
  );
  const switchCalls = await page.evaluate(() => window.__switchCalls);
  check('switch calls wallet_switchEthereumChain', switchCalls.some((c) => c.method === 'wallet_switchEthereumChain'));
  check('requested chain is 31337', switchCalls.some((c) => c.params?.[0]?.chainId === '0x7a69'),
    JSON.stringify(switchCalls.map((c) => c.params?.[0]?.chainId)));

  // 5. After the switch, banner clears and Send Payment returns
  await page.waitForFunction(
    () => !/Wrong network/i.test(document.body.innerText),
    { timeout: 10000 }
  ).catch(() => {});
  const bannerGone = await page.evaluate(() => !/Wrong network/i.test(document.body.innerText));
  const sendBack = await page.evaluate(() => /Send Payment/.test(document.body.innerText));
  check('banner clears after switch', bannerGone);
  check('Send Payment available after switch', sendBack);
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | ') || 'none');

  await browser.close();
  console.log(`\n${failures === 0 ? 'ALL NETWORK CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('NETWORK TEST ERROR:', e.message); process.exit(1); });
