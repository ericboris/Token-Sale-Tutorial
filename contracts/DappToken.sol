pragma solidity >=0.5.0;

contract DappToken {
    string public name = "DAppToken";
    string public symbol = "DAPP";
    string public standard = "DApp Token v1.0";

    uint256 public tokenSupply;

    event Transfer(
        address indexed _from,
        address indexed _to, 
        uint256 _value
    );

    mapping(address => uint256) public balanceOf;

    constructor (uint256 _initialSupply) public {
        balanceOf[msg.sender] = _initialSupply;
        tokenSupply = _initialSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value);

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);

        return true;
    }
}
