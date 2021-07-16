var DappToken = artifacts.require("./DappToken.sol");

contract("DappToken", (accounts) => {
    it("Sets the total supply upon deployment", () => {
        return DappToken.deployed().then((instance) => {
            tokenInstance = instance;
            return tokenInstance.tokenSupply();
        }).then((tokenSupply) => {
            assert.equal(tokenSupply.toNumber(), 1000000, "Sets the totalSupply to 1,000,000");
        });
    });
});
