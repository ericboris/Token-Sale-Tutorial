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
});
