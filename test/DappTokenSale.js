var DappToken = artifacts.require("./DappToken.sol");
var DappTokenSale = artifacts.require("./DappTokenSale.sol");

contract("Dapp Token Sale", (accounts) => {
    var tokenInstance;
    var tokenSaleInstance;
    var admin = accounts[0];
    var buyer = accounts[1];
    var tokenPrice = 1000000000000000 // In wei
    var tokensAvailable = 750000;
    var numberOfTokens;

    it("Initializes the contract with correct values", () => {
        return DappTokenSale.deployed().then((instance) => {
            tokenSaleInstance = instance;
            return tokenSaleInstance.address;
        }).then((address) => {
            assert.notEqual(address, 0x0, "Has contract address");
            return tokenSaleInstance.tokenContract();
        }).then((address) => {
            assert.notEqual(address, 0x0, "Has token contract address"); 
            return tokenSaleInstance.tokenPrice();
        }).then((price) => {
            assert.equal(price, tokenPrice, "Token price is correct");
        });
    });

    it("Facilitates token buying", () => {
        return DappToken.deployed().then((instance) => {
            // Grab token instance first
            tokenInstance = instance;
            return DappTokenSale.deployed();
        }).then((instance) => {
            // Then grab token sale instance
            tokenSaleInstance = instance;
            // Provision 75% of all tokens to the token sale
            return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });
        }).then((receipt) => {
            numberOfTokens = 10;
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice });
        }).then((receipt) => {
            assert.equal(receipt.logs.length, 1, "Triggers one event");
            assert.equal(receipt.logs[0].event, "Sell", "Should be the 'Sell' event"); 
            assert.equal(receipt.logs[0].args._buyer, buyer, "Logs the account that purchased the tokens"); 
            assert.equal(receipt.logs[0].args._amount, numberOfTokens, "Logs the number of tokens purchased"); 
            return tokenSaleInstance.tokensSold();
        }).then((amount) => {
            assert.equal(amount.toNumber(), numberOfTokens, "Increments the number of tokens sold"); 
            return tokenInstance.balanceOf(buyer);
        }).then((balance) => {
            assert.equal(balance.toNumber(), numberOfTokens);
            return tokenInstance.balanceOf(tokenSaleInstance.address);
        }).then((balance) => {
            assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf("revert") >= 0, "msg.value must equal number of tokens in wei");
            return tokenSaleInstance.buyTokens(1000000, { from: buyer, value: numberOfTokens * tokenPrice });
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf("revert") >= 0, "Cannot purchase more tokens than available");
        });
    });

    it("Ends token sale", () => {
        return DappToken.deployed().then((instance) => {
            tokenInstance = instance;
            return DappTokenSale.deployed();
        }).then((instance) => {
            tokenSaleInstance = instance;
            // Try to end sale while not admin.
            return tokenSaleInstance.endSale({ from: buyer });
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf("revert") >= 0, "Cannot end sale unless admin");
            // End sale as admin
            return tokenSaleInstance.endSale({ from: admin });
        }).then((receipt) => {
            return tokenInstance.balanceOf(admin);
        }).then((balance) => {
            assert.equal(balance.toNumber(), 999990, "Returns all unsold tokens to admin");
            return tokenSaleInstance.tokenPrice();
        }).then((price) => {
            assert.equal(price.toNumber(), 0, "Token price was reset");
        });
    });
});
