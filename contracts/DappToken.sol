pragma solidity >=0.5.0;

contract DappToken {
    uint256 public tokenSupply;

    constructor () public {
        tokenSupply = 1000000;
    }
}
