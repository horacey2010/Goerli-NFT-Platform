// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";


contract Platform_NFT is ERC721URIStorage, ERC2981 {

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  address private owner;
  uint256 private maxSupply;

  event MinterChanged(address _from, address _to);

  constructor() ERC721("NFT Platform Token", "NPT") {
    owner = msg.sender;
    _setDefaultRoyalty(msg.sender, 300);
    maxSupply = 100000;
  }

  event Mint(address indexed _owner, uint256 tokenId);

  function passMinterRole(address _nftPlatform) public returns(bool) {
      require(msg.sender==owner, 'Error, only owner can change pass minter role');
      owner = _nftPlatform;
      emit MinterChanged(msg.sender, _nftPlatform);
      return true;
  }

  function mint(string memory _tokenURI, address _nftowner) public returns(uint256) {
    require(msg.sender == owner, "Only NFT Platform can mint NFT");
    require(_tokenIds.current() <= maxSupply, "Maximun supply is 100000");
    _tokenIds.increment();
    uint256 newTokenId = _tokenIds.current();
    _safeMint(_nftowner, newTokenId);
    _setTokenURI(newTokenId, _tokenURI);
    emit Mint(_nftowner, newTokenId);
    return newTokenId;
  }

  function mintWithRoyalty(string memory _tokenURI, address royaltyReceiver, uint96 feeNumerator) public returns(uint256) {
    require(msg.sender == owner, "Only NFT Platform can mint NFT");
    uint256 newTokenId = mint(_tokenURI, royaltyReceiver);
    _setTokenRoyalty(newTokenId, royaltyReceiver, feeNumerator);
    return newTokenId;
  }

  function _burn(uint256 _tokenId) internal virtual override {
    super._burn(_tokenId);
    _resetTokenRoyalty(_tokenId);
  }

  function burnNFT(uint256 _tokenId) public {
    require(msg.sender == owner, "Only NFT Platform can mint NFT");
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
