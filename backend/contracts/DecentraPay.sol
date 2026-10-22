// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title DecentraPay - A Blockchain-Based Secure Cryptocurrency Transaction System
/// @notice Validates, executes and records peer-to-peer ETH transfers in a
///         single transaction, so the sender only signs once via MetaMask.
contract DecentraPay {
    uint256 private _txCount;

    struct Payment {
        address sender;
        address receiver;
        uint256 amount;
        string  message;
        uint256 timestamp;
    }

    Payment[] private _ledger;

    event PaymentRecorded(
        address indexed from,
        address indexed to,
        uint256 amount,
        string  message,
        uint256 timestamp
    );

    /// @notice Send ETH to `receiver` and record the payment on-chain.
    /// @param receiver Recipient wallet address.
    /// @param message  Optional transaction message (empty string if none).
    function sendPayment(address payable receiver, string calldata message)
        external
        payable
    {
        // --- Validation (synopsis: "Validating transaction requests") ---
        require(receiver != address(0), "DecentraPay: receiver is the zero address");
        require(receiver != msg.sender, "DecentraPay: cannot send to yourself");
        require(msg.value > 0, "DecentraPay: amount must be greater than 0");
        require(bytes(message).length <= 256, "DecentraPay: message too long");

        // --- Execution ("Executing cryptocurrency transfers") ---
        _txCount += 1;
        (bool sent, ) = receiver.call{value: msg.value}("");
        require(sent, "DecentraPay: ETH transfer failed");

        // --- Recording ("Recording transaction details on the blockchain") ---
        _ledger.push(
            Payment(msg.sender, receiver, msg.value, message, block.timestamp)
        );
        emit PaymentRecorded(msg.sender, receiver, msg.value, message, block.timestamp);
    }

    /// @notice Return every recorded payment.
    function fetchAllPayments() external view returns (Payment[] memory) {
        return _ledger;
    }

    /// @notice Total number of recorded payments.
    function totalPayments() external view returns (uint256) {
        return _txCount;
    }

    /// @notice Contract ETH balance (should always be 0; funds are forwarded).
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
