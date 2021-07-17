var DappToken = artifacts.require("./DappToken.sol");

contract("DappToken", (accounts) => {
    var tokenInstance;

    it("Initializes the contract to the correct values", () => {
        return DappToken.deployed().then((instance) => {
            tokenInstance = instance;
            return tokenInstance.name();
        }).then((name) => {
            assert.equal(name, "DAppToken", "Has the correct name");
            return tokenInstance.symbol();
        }).then((symbol) => {
            assert.equal(symbol, "DAPP", "Has the correct symbol");
            return tokenInstance.standard();
        }).then((standard) => {
            assert.equal(standard, "DApp Token v1.0", "Has the correct standard");
        });
    });
    
    it("Allocates the initial supply upon deployment", () => {
        return DappToken.deployed().then((instance) => {
            tokenInstance = instance;
            return tokenInstance.tokenSupply();
        }).then((tokenSupply) => {
            assert.equal(tokenSupply.toNumber(), 1000000, "Sets the totalSupply to 1,000,000");
            return tokenInstance.balanceOf(accounts[0]);
        }).then((adminBalance) => {
            assert.equal(adminBalance.toNumber(), 1000000, "Allocates the initial supply to the admin account");
        });
    });

    it("Transfers token ownership", () => {
        return DappToken.deployed().then((instance) => {
            tokenInstance = instance;
            return tokenInstance.transfer.call(accounts[1], 999999999999999999999999);
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf("revert"), "Error message must contain revert");
            return tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] });
        }).then((success) => {
            assert.equal(success, true, "It returns true");
            return tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] });
        }).then((receipt) => {
            assert.equal(receipt.logs.length, 1, "Triggers one event");
            assert.equal(receipt.logs[0].event, "Transfer", "Should be the 'Transfer' event"); 
            assert.equal(receipt.logs[0].args._from, accounts[0], "Logs the account the tokens are transferred from"); 
            assert.equal(receipt.logs[0].args._to, accounts[1], "Logs the account the tokens are transferred to"); 
            assert.equal(receipt.logs[0].args._value, 250000, "Logs the transfer amount"); 
            return tokenInstance.balanceOf(accounts[1]);
        }).then((balance) => {
            assert.equal(balance.toNumber(), 250000, "Adds the amount to the receiving account");
            return tokenInstance.balanceOf(accounts[0]);
        }).then((balance) => {
            assert.equal(balance.toNumber(), 750000, "Removes the amount from the sending account");
        });
    });

    it("Approves tokens for delegated transfer", () => {
        return DappToken.deployed().then((instance) => {
            tokenInstance = instance;
            return tokenInstance.approve.call(accounts[1], 100);
        }).then((success) => {
            assert.equal(success, true, "Returns true");
            return tokenInstance.approve(accounts[1], 100, { from: accounts[0] });
        }).then((receipt) => {
            assert.equal(receipt.logs.length, 1, "Triggers one event");
            assert.equal(receipt.logs[0].event, "Approval", "Should be the 'Approval' event"); 
            assert.equal(receipt.logs[0].args._owner, accounts[0], "Logs the account delegating spending"); 
            assert.equal(receipt.logs[0].args._spender, accounts[1], "Logs the spending account"); 
            assert.equal(receipt.logs[0].args._value, 100, "Logs the transfer amount"); 
            return tokenInstance.allowance(accounts[0], accounts[1]);
        }).then((allowance) => {
            assert.equal(allowance.toNumber(), 100, "Stores the allowance for delegated transfer");
        });
    });

    it("Handles delegated token transfer", () => {
        return DappToken.deployed().then((instance) => {
            tokenInstance = instance;
            fromAccount = accounts[2];
            toAccount = accounts[3];
            spendingAccount = accounts[4];
            // Transfer tokens to fromAccount
            return tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });
        }).then((receipt) => {
            // Approve spendingAccount to spend 10 tokens from fromAccount
            return tokenInstance.approve(spendingAccount, 10, {from: fromAccount });
        }).then((receipt) => {
            // Try to transfer more funds from fromAccount than are available to toAccount
            return tokenInstance.transferFrom(fromAccount, toAccount, 9999, { from: spendingAccount });
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf("revert"), "Can't transfer value greater than balance");
            // Try to transfer more funds to toAccount than permitted by fromAccount
            return tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount });
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf("revert"), "Can't transfer value greater than allowed");
            return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });
        }).then((success) => {
            assert.equal(success, true, "Returns true");
            return tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount });
        }).then((receipt) => {
            assert.equal(receipt.logs.length, 1, "Triggers one event");
            assert.equal(receipt.logs[0].event, "Transfer", "Should be the 'Transfer' event"); 
            assert.equal(receipt.logs[0].args._from, fromAccount, "Logs the account the tokens are transferred from"); 
            assert.equal(receipt.logs[0].args._to, toAccount, "Logs the account the tokens are transferred to"); 
            assert.equal(receipt.logs[0].args._value, 10, "Logs the transfer amount"); 
            return tokenInstance.allowance(fromAccount, spendingAccount);
        }).then((allowance) => {
            assert.equal(allowance.toNumber(), 0, "Deducts amount from allowance");
            return tokenInstance.balanceOf(fromAccount);
        }).then((fromAccountBalance) => {
            assert.equal(fromAccountBalance.toNumber(), 90, "Deducts amount from sending account");
            return tokenInstance.balanceOf(toAccount);
        }).then((toAccountBalance) => {
            assert.equal(toAccountBalance.toNumber(), 10, "Deposits amount in receiving account");
        });
    });
});
