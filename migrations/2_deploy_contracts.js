const DappToken = artifacts.require("./DappToken.sol");
const DappTokenSale = artifacts.require("./DappTokenSale.sol");

module.exports = (deployer) => {
    deployer.deploy(DappToken, 1000000).then(() => {
        const tokenPrice = 1000000000000000;
        return deployer.deploy(DappTokenSale, DappToken.address, tokenPrice);
    });
};
