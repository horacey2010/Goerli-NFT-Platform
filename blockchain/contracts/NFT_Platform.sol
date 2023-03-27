// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Platform_NFT.sol";
import "./RentablePlatformNFT.sol";
import "./IPUSHCommInterface.sol";

interface DbtToken {
    function transfer(address dst, uint wad) external returns (bool);
    function transferFrom(address src, address dst, uint wad) external returns (bool);
    function balanceOf(address guy) external view returns (uint);
}

contract NFT_Platform is ERC721Holder, ReentrancyGuard {

  address private owner;
  address private plateformNftAddress;
  DbtToken public dbtToken;
  Platform_NFT public platformNFT;
  RentablePlatformNFT public rentableNFT;

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
    uint256 stakedReward;
  }

  struct RentingNFT {
    uint256 pricePerDay;
    uint256 startDateUNIX;
    uint256 endDateUNIX;
  }

  struct Marketplace {
    uint256 tokenId;
    uint256 price;
    address seller;
  }

  mapping(uint => ListingNFT) private listingNFTMap;
  mapping(uint => StakingNFT) private stakingNFTMap;
  mapping(uint => RentingNFT) private rentingNFTMap; // tokenId => RentingNFT
  mapping(uint => Marketplace) private marketplaceMap;

  uint public counter;
  uint public stakeCounter;
  uint public rentCounter;
  uint public marketplaceCounter;
  // uint private mintAIFee = 1 ether;
  uint private listToMarketplaceFee = 2e17;
  uint private mintReward = 1e18;

  uint256 public rewardsPerSecond = 30; 
  // e.g. 300 wei per second, 25,920,000 wei per day or 0.00000000002592 token per day
  // uint256 public rewardsPerSecond = (1 * 10 ^ 18) / 1 days; //  earn 1 tokens per day

  event StakeToPlatform(uint indexed _tokenId, uint stakedStart, address _owner);
  event Unstake(uint256 indexed _tokenId, address _owner, uint256 _rewards);
  event BuyNFT(uint256 indexed _tokenId, uint256 _nftPrice, address buyer, uint256 timestamp);

  constructor(address _dbtAddress, Platform_NFT _platformNFT, RentablePlatformNFT _rentableNFT) {
    platformNFT = _platformNFT;
    rentableNFT = _rentableNFT;
    owner = msg.sender;
    dbtToken = DbtToken(_dbtAddress);
  }


  function listToPlatform(string[] calldata _tokenURI, uint256[] memory _price) external {
    require(msg.sender == owner);
    for (uint i=0; i<_tokenURI.length; i++) {
      listingNFTMap[counter+1] = ListingNFT(_price[i], _tokenURI[i], false);
      counter++;
    }
  }

  function clearList() external {
    require(msg.sender == owner);
    for (uint i=1; i<=counter; i++) {
      delete listingNFTMap[i];
    }
    counter = 0;
  }

  function listToRentablePlatform(uint256[] memory _tokenId, uint256[] memory _pricePerDay, uint256[] memory _startDateUNIX, uint256[] memory _endDateUNIX) external {
    require(msg.sender == owner);
    for (uint i=0; i<_tokenId.length; i++) {
      rentingNFTMap[rentCounter+1] = RentingNFT(
        _pricePerDay[i],
        _startDateUNIX[i],
        _endDateUNIX[i]
      );
      rentCounter++;
    }
  }

  function clearRentableList() external {
    require(msg.sender == owner);
    for (uint i=1; i<=rentCounter; i++) {
      delete rentingNFTMap[i];
    }
    rentCounter = 0;
  }

  function rentToPlatform(uint256 _tokenId, uint64 _expires, uint256 _numDays) public payable nonReentrant {
    RentingNFT storage rentingNFT = rentingNFTMap[_tokenId];
    require(rentableNFT.userOf(_tokenId) == address(0) || block.timestamp > rentableNFT.userExpires(_tokenId));
    require(_expires <= rentingNFT.endDateUNIX);
    uint256 numDays = _numDays;
    uint256 rentalFee = rentingNFT.pricePerDay * numDays;
    require(msg.value >= rentalFee);
    rentableNFT.setUser(_tokenId, msg.sender, _expires);
    payable(owner).transfer(rentalFee);
  }

  function checkHaveRented() public view returns(bool) {
    uint rentableTokenIds = rentableNFT.getTokenIds();
    bool rented;
    for (uint check=1; check<=rentableTokenIds; check++) {
      if (rentableNFT.userOf(check) == msg.sender && uint64(rentableNFT.userExpires(check)) > uint64(block.timestamp)) {
        rented = true;
      }
    }
    return rented;
  }

  function changeRentData(uint256 _tokenId, uint256 _pricePerDay, uint256 _startDateUNIX, uint256 _endDateUNIX) external {
    require(msg.sender == owner);
    RentingNFT storage rentingNFT = rentingNFTMap[_tokenId];
    require(rentableNFT.userOf(_tokenId) == address(0) || block.timestamp > rentableNFT.userExpires(_tokenId));
    require(_pricePerDay > 0);
    require(_endDateUNIX > _startDateUNIX);
    rentingNFT.pricePerDay = _pricePerDay;
    rentingNFT.startDateUNIX = _startDateUNIX;
    rentingNFT.endDateUNIX = _endDateUNIX;
    rentingNFTMap[_tokenId] = rentingNFT;
  }

  function listToMarketplace(uint256 _tokenId, uint256 _price) public nonReentrant {
    require(platformNFT.ownerOf(_tokenId) == msg.sender);
    require(_price > 0);
    require(dbtToken.balanceOf(msg.sender) >= listToMarketplaceFee);
    dbtToken.transferFrom(msg.sender, owner, listToMarketplaceFee);
    marketplaceCounter++;
    marketplaceMap[marketplaceCounter] = Marketplace(_tokenId, _price, msg.sender); 
  }

  function unlistToMarketplace(uint256 _tokenId) public nonReentrant {
    require(platformNFT.ownerOf(_tokenId) == msg.sender);
    Marketplace memory marketplace;
    uint index;
    for (uint i=1; i<=marketplaceCounter; i++) {
      if (marketplaceMap[i].tokenId == _tokenId) {
        marketplace = marketplaceMap[i];
        index = i;
      }
    }
    marketplace.tokenId = 0;
    marketplace.price = 0;
    marketplace.seller = address(0);
    marketplaceMap[index] = marketplace;
  }

  function buyNFT(uint256 _tokenId, address _royaltyReceiver, uint256 _royaltyAmount) public payable nonReentrant {
    require(_tokenId > 0);
    Marketplace memory marketplace;
    uint index;
    for (uint i=1; i<=marketplaceCounter; i++) {
      if (marketplaceMap[i].tokenId == _tokenId) {
        marketplace = marketplaceMap[i];
        index = i;
      }
    }
    require(msg.sender != platformNFT.ownerOf(marketplace.tokenId));
    require(platformNFT.ownerOf(marketplace.tokenId) == marketplace.seller);
    if (owner != _royaltyReceiver) {
      if (_royaltyReceiver == platformNFT.ownerOf(marketplace.tokenId)) {
        require(msg.value >= marketplace.price);
        payable(platformNFT.ownerOf(marketplace.tokenId)).transfer(marketplace.price);
      } else {
        require(msg.value >= marketplace.price + _royaltyAmount);
        payable(platformNFT.ownerOf(marketplace.tokenId)).transfer(marketplace.price);
        payable(_royaltyReceiver).transfer(_royaltyAmount);
      }
    } else {
      require(msg.value >= marketplace.price);
      payable(platformNFT.ownerOf(marketplace.tokenId)).transfer(marketplace.price);
    }
    address notificationReceiver = platformNFT.ownerOf(marketplace.tokenId);
    platformNFT.transferFrom(platformNFT.ownerOf(marketplace.tokenId), msg.sender, _tokenId);
    marketplace.tokenId = 0;
    marketplace.price = 0;
    marketplace.seller = address(0);
    marketplaceMap[index] = marketplace;

    string memory body = "Congraduation!! Your NFT have been sold on NFT Platform";
    IPUSHCommInterface(address(0xb3971BCef2D791bc4027BbfedFb47319A4AAaaAa)).sendNotification(
      owner,
      notificationReceiver,
      bytes(
        string(
                abi.encodePacked(
                    "0", // this is notification identity: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/identity/payload-identity-implementations
                    "+", // segregator
                    "3", // this is payload type: https://docs.epns.io/developers/developer-guides/sending-notifications/advanced/notification-payload-types/payload (1, 3 or 4) = (Broadcast, targetted or subset)
                    "+", // segregator
                    "Notification from NFT Platform", // this is notification title
                    "+", // segregator
                    body // notification body
                )
            )
        )
    );
    emit BuyNFT(_tokenId, msg.value, msg.sender, block.timestamp);
  }

  function stakeToPlatform(uint256 _tokenId, uint256 _latestPrice) public nonReentrant {
    require(platformNFT.ownerOf(_tokenId) == msg.sender);
    platformNFT.safeTransferFrom(msg.sender, address(this), _tokenId);
    stakeCounter++;
    stakingNFTMap[stakeCounter] = StakingNFT(block.timestamp, msg.sender, _tokenId, stakeCounter, _latestPrice);
    emit StakeToPlatform(_tokenId, block.timestamp, msg.sender);
  }

  function calculateRewards(uint256 _index) public view returns(uint) {
    uint256 timeElapsed = block.timestamp - stakingNFTMap[_index].stakedStart;
    if (stakingNFTMap[_index].stakedReward > 1e17) {
      return (timeElapsed * rewardsPerSecond * 2);
    } else {
      return (timeElapsed * rewardsPerSecond);
    }
  }

  function unStake(uint256 _tokenId, uint256 _index) public nonReentrant {
    StakingNFT memory item = stakingNFTMap[_index];
    require(item.tokenId == _tokenId);
    uint256 rewards = calculateRewards(_index);
    require(dbtToken.balanceOf(address(this)) >= rewards);
    dbtToken.transfer(msg.sender, rewards);
    platformNFT.transferFrom(address(this), msg.sender, _tokenId);
    delete stakingNFTMap[_index];
    emit Unstake(_tokenId, msg.sender, rewards);
  }

  function getAllListingItem() public view returns(ListingNFT[] memory) {
    ListingNFT[] memory allItems = new ListingNFT[](counter);
    for (uint i=0; i<counter; i++) {
      allItems[i] = listingNFTMap[i+1];
    } 
    return allItems;
  }

  function getAllRentingItem() public view returns(RentingNFT[] memory) {
    RentingNFT[] memory allItems = new RentingNFT[](rentCounter);
    for (uint i=0; i<rentCounter; i++) {
      allItems[i] = rentingNFTMap[i+1];
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

  function getAllMarketplaceItem() public view returns(Marketplace[] memory) {
    Marketplace[] memory allMarketplaceItems = new Marketplace[](marketplaceCounter);
    for (uint i=0; i<marketplaceCounter; i++) {
      if (marketplaceMap[i+1].tokenId > 0) {
        allMarketplaceItems[i] = marketplaceMap[i+1];
      }
    }
    return allMarketplaceItems;
  }

  function getTokenIds() view public returns (uint) {
    return platformNFT.getTokenIds();
  }
  
  function getOwner() public view returns(address) {
    return owner;
  }

  function getMintReward() public view returns(uint) {
    return mintReward;
  }

  function platformMint(uint256 itemId) public payable returns(uint256) {
    uint doubleReward;
    if (checkHaveRented()) {
      doubleReward = 2;
    } else {
      doubleReward = 1;
    }
    ListingNFT memory item = listingNFTMap[itemId];
    require(dbtToken.balanceOf(address(this)) >= mintReward * doubleReward);
    require(msg.value >= item.nftPrice);
    string memory _tokenURI = item.tokenUri;
    uint newTokenId = platformNFT.mint(_tokenURI, msg.sender);
    dbtToken.transfer(msg.sender, mintReward * doubleReward);
    item.isMinted = true;
    listingNFTMap[itemId] = item;
    return newTokenId;
  }

  function mintWithRoyalty(uint256 itemId, uint96 feeNumerator) public payable returns(uint256) {
    uint doubleReward;
    if (checkHaveRented()) {
      doubleReward = 2;
    } else {
      doubleReward = 1;
    }
    ListingNFT memory item = listingNFTMap[itemId];
    require(msg.value >= item.nftPrice);
    require(dbtToken.balanceOf(address(this)) >= mintReward * doubleReward);
    string memory _tokenURI = item.tokenUri;
    uint256 newTokenId = platformNFT.mintWithRoyalty(_tokenURI, msg.sender, feeNumerator);  
    dbtToken.transfer(msg.sender, mintReward * doubleReward);
    item.isMinted = true;
    listingNFTMap[itemId] = item;
    return newTokenId;
  }

  function burnPlatformNFT(uint256 _tokenId) external {
    require(msg.sender == owner);
    platformNFT.burnNFT(_tokenId);
  }

  function changeMintReward(uint newMintReward) external {
    require(msg.sender == owner);
    mintReward = newMintReward;
  }

  function changeReward(uint newReward) external {
    require(msg.sender == owner);
    rewardsPerSecond = newReward;
  }

  function changeListToMarketplaceFee(uint256 newValue) external {
    require(msg.sender == owner);
    listToMarketplaceFee = newValue;
  }

  function withdrawAll() external {
    require(msg.sender == owner);
    uint balance = address(this).balance;
    uint dbtBalance = dbtToken.balanceOf(address(this));
    payable(owner).transfer(balance); 
    dbtToken.transfer(owner, dbtBalance);   
  }

}
