// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";


contract Platform_NFT is ERC721URIStorage, ERC2981 {

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  address private owner;

  event MinterChanged(address _from, address _to);

  constructor() ERC721("NFT Platform Token", "NPT") {
    owner = msg.sender;
    _setDefaultRoyalty(msg.sender, 300);
  }

  event Mint(address indexed _owner, uint256 tokenId);

  function mint(string memory _tokenURI, address _nftowner) public returns(uint256) {
    _tokenIds.increment();
    uint256 newTokenId = _tokenIds.current();
    _safeMint(_nftowner, newTokenId);
    _setTokenURI(newTokenId, _tokenURI);
    emit Mint(_nftowner, newTokenId);
    return newTokenId;
  }

  function mintWithRoyalty(string memory _tokenURI, address royaltyReceiver, uint96 feeNumerator) public  {
    uint256 _tokenId = mint(_tokenURI, royaltyReceiver);
    _setTokenRoyalty(_tokenId, royaltyReceiver, feeNumerator);
  }

  function _burn(uint256 _tokenId) internal virtual override {
    super._burn(_tokenId);
    _resetTokenRoyalty(_tokenId);
  }

  function burnNFT(uint256 _tokenId) public {
    require(msg.sender == owner);
    _burn(_tokenId);
  }

  function supportsInterface(bytes4 interfaceId)
    public view virtual override(ERC721, ERC2981)
    returns (bool) {
      return super.supportsInterface(interfaceId);
  }

  function getTokenIds() view public returns (uint256) {
    uint tokenIds = _tokenIds.current();
    return tokenIds;
  }


} 
