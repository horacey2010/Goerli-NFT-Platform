// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./ERC4907.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RentablePlatformNFT is ERC4907 {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  address private owner;

  constructor() ERC4907("Rentable Platform Token", "rPT") {
    owner = msg.sender;
  }

  function mint(string[] memory _tokenURI) public {
    require(msg.sender == owner);
    uint256 newTokenId; 
    for (uint i=0; i<_tokenURI.length; i++) {
      _tokenIds.increment();
      newTokenId = _tokenIds.current(); 
      _safeMint(msg.sender, newTokenId);
      _setTokenURI(newTokenId, _tokenURI[i]);
    }
  }

  function getTokenIds() view public returns(uint) {
    uint tokenIds = _tokenIds.current();
    return tokenIds;
  }

  function  burnRentableNFT(uint256 tokenId) external {
    require(msg.sender == owner);
    _burn(tokenId);
  }

}
