const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DecentraPay", function () {
  async function deployFixture() {
    const [sender, receiver, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DecentraPay");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    return { contract, sender, receiver, stranger };
  }

  it("starts with zero payments", async function () {
    const { contract } = await loadFixture(deployFixture);
    expect(await contract.totalPayments()).to.equal(0);
  });

  it("executes the ETH transfer to the receiver", async function () {
    const { contract, receiver } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("0.5");

    const before = await ethers.provider.getBalance(receiver.address);
    await contract.sendPayment(receiver.address, "Coffee", { value: amount });
    const after = await ethers.provider.getBalance(receiver.address);

    expect(after - before).to.equal(amount);
  });

  it("does not hold funds in the contract", async function () {
    const { contract, receiver } = await loadFixture(deployFixture);
    await contract.sendPayment(receiver.address, "Tip", {
      value: ethers.parseEther("1.0"),
    });
    expect(await contract.getContractBalance()).to.equal(0);
  });

  it("stores payment details", async function () {
    const { contract, sender, receiver } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("0.25");

    await contract.sendPayment(receiver.address, "Dinner", { value: amount });

    const payments = await contract.fetchAllPayments();
    expect(payments).to.have.lengthOf(1);
    expect(payments[0].sender).to.equal(sender.address);
    expect(payments[0].receiver).to.equal(receiver.address);
    expect(payments[0].amount).to.equal(amount);
    expect(payments[0].message).to.equal("Dinner");
    expect(payments[0].timestamp).to.be.greaterThan(0);
  });

  it("accepts an empty message", async function () {
    const { contract, receiver } = await loadFixture(deployFixture);
    await contract.sendPayment(receiver.address, "", {
      value: ethers.parseEther("0.1"),
    });
    const payments = await contract.fetchAllPayments();
    expect(payments[0].message).to.equal("");
  });

  it("emits PaymentRecorded event", async function () {
    const { contract, sender, receiver } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("0.3");

    await expect(contract.sendPayment(receiver.address, "Thanks!", { value: amount }))
      .to.emit(contract, "PaymentRecorded")
      .withArgs(
        sender.address,
        receiver.address,
        amount,
        "Thanks!",
        (ts) => ts > 0n
      );
  });

  it("reverts on zero-address receiver", async function () {
    const { contract } = await loadFixture(deployFixture);
    await expect(
      contract.sendPayment(ethers.ZeroAddress, "x", { value: 1 })
    ).to.be.revertedWith("DecentraPay: receiver is the zero address");
  });

  it("reverts when sending to yourself", async function () {
    const { contract, sender } = await loadFixture(deployFixture);
    await expect(
      contract.sendPayment(sender.address, "x", { value: 1 })
    ).to.be.revertedWith("DecentraPay: cannot send to yourself");
  });

  it("reverts on zero amount", async function () {
    const { contract, receiver } = await loadFixture(deployFixture);
    await expect(
      contract.sendPayment(receiver.address, "x", { value: 0 })
    ).to.be.revertedWith("DecentraPay: amount must be greater than 0");
  });

  it("reverts on oversized message", async function () {
    const { contract, receiver } = await loadFixture(deployFixture);
    const longMessage = "a".repeat(257);
    await expect(
      contract.sendPayment(receiver.address, longMessage, { value: 1 })
    ).to.be.revertedWith("DecentraPay: message too long");
  });

  it("counts multiple payments correctly", async function () {
    const { contract, receiver, stranger } = await loadFixture(deployFixture);
    await contract.sendPayment(receiver.address, "one", { value: 100 });
    await contract.sendPayment(stranger.address, "two", { value: 200 });
    expect(await contract.totalPayments()).to.equal(2);
    const payments = await contract.fetchAllPayments();
    expect(payments).to.have.lengthOf(2);
  });
});
