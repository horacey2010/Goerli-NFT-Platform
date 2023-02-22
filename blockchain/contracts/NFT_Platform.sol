// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "./Platform_NFT.sol";

interface DbtToken {
    function transfer(address dst, uint wad) external returns (bool);
    function transferFrom(address src, address dst, uint wad) external returns (bool);
    function balanceOf(address guy) external view returns (uint);
}

contract NFT_Platform is ERC721Holder {

  address private owner;
  address private plateformNftAddress;
  DbtToken public dbtToken;
  Platform_NFT public platformNFT;


  struct ListingNFT {
    uint256 nftPrice;
    string tokenUri;
    bool isMinted;
  }

  struct StakingNFT {
    uint256 stakedStart;
    address owner;
    uint256 tokenId;
    uint256 index;
  }

  mapping(uint => ListingNFT) private listingNFTMap;
  mapping(uint => StakingNFT) private stakingNFTMap;

  uint public counter;
  uint public stakeCounter;
  uint private mintAIFee = 1 ether;

  uint256 public rewardsPerSecond = 30; 
  // e.g. 300 wei per second, 25,920,000 wei per day or 0.00000000002592 token per day
  // uint256 public rewardsPerSecond = (1 * 10 ^ 18) / 1 days; //  earn 1 tokens per day

  event ListToPlatform(uint indexed _counter, uint _nftPrice, string _tokenUri);
  event StakeToPlatform(uint indexed _tokenId, uint stakedStart, address _owner);
  event Unstake(uint256 indexed _tokenId, address _owner, uint256 _rewards);

  constructor(address _dbtAddress, Platform_NFT _platformNFT) {
    platformNFT = _platformNFT;
    owner = msg.sender;
    dbtToken = DbtToken(_dbtAddress);
  }

  function listToPlatform(string  calldata _tokenUri, uint256 _nftPrice) public {
    require(msg.sender == owner, "Only owner can list");
    require(_nftPrice > 0 && bytes(_tokenUri).length > 0, "Invalid input");
    counter++;
    listingNFTMap[counter] = ListingNFT(_nftPrice, _tokenUri, false);
    emit ListToPlatform(counter, _nftPrice, _tokenUri);
  }

  function stakeToPlatform(uint256 _tokenId) public {
    require(platformNFT.ownerOf(_tokenId) == msg.sender, "Not the owner");
    platformNFT.safeTransferFrom(msg.sender, address(this), _tokenId);
    stakeCounter++;
    stakingNFTMap[stakeCounter] = StakingNFT(block.timestamp, msg.sender, _tokenId, stakeCounter);
    emit StakeToPlatform(_tokenId, block.timestamp, msg.sender);
  }

  function calculateRewards(uint256 _index) public view returns(uint) {
    uint256 timeElapsed = block.timestamp - stakingNFTMap[_index].stakedStart;
    return (timeElapsed * rewardsPerSecond);
    
  }

  function unStake(uint256 _tokenId, uint256 _index) public {
    StakingNFT memory item = stakingNFTMap[_index];
    require(item.tokenId == _tokenId, "wrong tokenId");
    uint256 rewards = calculateRewards(_index);
    require(dbtToken.balanceOf(address(this)) >= rewards, "not enough reward");
    dbtToken.transfer(msg.sender, rewards);
    platformNFT.transferFrom(address(this), msg.sender, _tokenId);
    item.stakedStart = 0;
    stakingNFTMap[_index] = item;
    emit Unstake(_tokenId, msg.sender, rewards);
  }

  function getAllListingItem() public view returns(ListingNFT[] memory) {
    ListingNFT[] memory allItems = new ListingNFT[](counter);
    for (uint i=0; i<counter; i++) {
      allItems[i] = listingNFTMap[i+1];
    } 
    return allItems;
  }

  function getAllStakingItem() public view returns(StakingNFT[] memory) {
    StakingNFT[] memory allStakedItems = new StakingNFT[](stakeCounter);
    for(uint i=0; i<stakeCounter; i++) {
      if (stakingNFTMap[i+1].owner != address(0)) {
        allStakedItems[i] = stakingNFTMap[i+1];
      }
    }
    return allStakedItems;
  }

  function platformMint(uint256 itemId) public payable returns(uint256) {
    ListingNFT memory item = listingNFTMap[itemId];
    require(msg.value >= item.nftPrice, "Not enough eth to mint NFT");
    require(dbtToken.balanceOf(address(this)) >= 1e18,"Not enough DBT");
    string memory _tokenURI = item.tokenUri;
    uint newTokenId = platformNFT.mint(_tokenURI, msg.sender);
    dbtToken.transfer(msg.sender, 1e18);
    item.isMinted = true;
    listingNFTMap[itemId] = item;
    return newTokenId;
  }

  function aiMint(string memory _tokenURI) public payable {
    require(msg.value >= mintAIFee, "Payment not enough");
    require(dbtToken.balanceOf(address(this)) >= 1e18, "Not enough dbt ");
    platformNFT.mint(_tokenURI, msg.sender);
    dbtToken.transfer(msg.sender, 1e18);
  }

  function mintWithRoyalty(uint256 itemId, uint96 feeNumerator) public payable {
    ListingNFT memory item = listingNFTMap[itemId];
    require(msg.value >= item.nftPrice, "Not enough eth to mint NFT");
    require(dbtToken.balanceOf(address(this)) >= 1e18,"Not enough DBT");
    string memory _tokenURI = item.tokenUri;
    platformNFT.mintWithRoyalty(_tokenURI, msg.sender, feeNumerator);  
    dbtToken.transfer(msg.sender, 1e18);
    item.isMinted = true;
    listingNFTMap[itemId] = item;
  }

  function aiMintWithRoyalty(string memory _tokenURI, uint96 feeNumerator) public payable {
    require(msg.value >= mintAIFee, "Payment not enough");
    require(dbtToken.balanceOf(address(this)) >= 1e18, "Not enough dbt ");
    platformNFT.mintWithRoyalty(_tokenURI, msg.sender, feeNumerator);
    dbtToken.transfer(msg.sender, 1e18);
  }

  function getTokenIds() view public returns (uint) {
    return platformNFT.getTokenIds();
  }
  
  function getMintAIFee() public view returns(uint256) {
    return mintAIFee;
  }

  function changeMintAIFee(uint newValue) external {
    require(msg.sender == owner, "only owner can change it");
    mintAIFee = newValue;
  }

  function changeReward(uint newReward) external {
    require(msg.sender == owner, "only owner can change it");
    rewardsPerSecond = newReward;
  }

  function burnPlatformNFT(uint256 _tokenId) public {
    require(msg.sender == owner, "only owner can burn it");
    platformNFT.burnNFT(_tokenId);
  }

  function withdrawAll() external {
    require(msg.sender == owner, "account not allow to get Listing Fee");
    uint balance = address(this).balance;
    uint dbtBalance = dbtToken.balanceOf(address(this));
    payable(owner).transfer(balance); 
    dbtToken.transfer(owner, dbtBalance);   
  }



}
