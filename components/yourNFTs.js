import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Modal from './Modal'
import ModalS from './ModalS'

export default function YourNFT({ nftPlatform, nftPlatformAddress, address, platformNFT, rewardsPerSecond, web3, dbtContract, owner }) {

    const router = useRouter()

    const [showModal, setShowModal] = useState(false)
    const [showModals, setShowModals] = useState(false)
    const [image, setImage] = useState()
    const [attributes, setAttributes] = useState([])
    const [name, setName] = useState()
    const [description, setDesription] = useState() 
    const [royalty, setRoyalty] = useState()
    const [tokenId, setTokenId] = useState()
    const [price, setPrice] = useState()
    const [onSale, setOnSale] = useState(false)
    const [yourNfts, setYourNfts] = useState([])
    const [allMarketplaceItems, setAllMarketplaceItems] = useState([])
    const [tokenUri, setTokenUri] = useState()

    useEffect(() => {
        if (address) {
            loadYourNFTsData()
            loadMarketplaceData()
        }
    }, [address, nftPlatform])

    const loadYourNFTsData = async () => {
        let _tokenIds = await platformNFT.methods.getTokenIds().call()
        console.log("_tokenIds", _tokenIds.toString())
          
        let _yourNfts = []
        let _royalty
        for (let id=1; id<=_tokenIds; id++) {
          _royalty = false
          let nftOwner = await platformNFT.methods.ownerOf(id).call()
          console.log("tokenId", id)
          console.log("owner", nftOwner)
          if (nftOwner == address) {
            let yourTokenUri = await platformNFT.methods.tokenURI(id).call()
            console.log("your token uri", yourTokenUri)
            yourTokenUri = yourTokenUri.replace("ipfs://", "https://nftstorage.link/ipfs/")
            console.log("your token uri 2", yourTokenUri)
            let metadata = await fetch(yourTokenUri).then((response) => response.json())
            let result = await platformNFT.methods.royaltyInfo(id, web3.utils.toWei("0.2").toString()).call()
            console.log("receiver", result[0])
            console.log("receiverroyalty", result[1])
            if (result[0] != owner) {
              _royalty = "Yes"
            } else {
              _royalty = "No"
            }
            console.log("royalty", _royalty)
            const yourItem = {
              image: metadata["image"],
              name: metadata["name"],
              description: metadata["description"],
              attributes: metadata["attributes"],
              royalty: _royalty, 
              tokenId: id,
              tokenUri: yourTokenUri,
            }
            console.log("yourItem", yourItem)
            _yourNfts = [..._yourNfts, yourItem]
          }
        }
        setYourNfts(_yourNfts)
    }

    const loadMarketplaceData = async () => {
        let _allMarketplaceItems = []
        let allMarketplaceItems = await nftPlatform.methods.getAllMarketplaceItem().call()
        if (allMarketplaceItems) {
            for (let d=0; d<allMarketplaceItems.length; d++) {
                if (allMarketplaceItems[d].tokenId > 0) {
                  let tokenUri = await platformNFT.methods.tokenURI(allMarketplaceItems[d].tokenId).call()
                  let metadata = await fetch(tokenUri).then((response) => response.json())
                  const marketplaceItem = {
                    image: metadata["image"],
                    name: metadata["name"],
                    description: metadata["description"],
                    attributes: metadata["attributes"],
                    tokenId: allMarketplaceItems[d].tokenId,
                    price: allMarketplaceItems[d].price,
                    hide: allMarketplaceItems[d].hide,
                  }
                  _allMarketplaceItems = [..._allMarketplaceItems, marketplaceItem]
                }
            }
        }
        setAllMarketplaceItems(_allMarketplaceItems)
    }
    
  
    const displayModal = (_image, _attributes, _name, _description, _royalty, _tokenId, _tokenUri) => {
        loadMarketplaceData()
        for (let i=0; i<allMarketplaceItems.length; i++) {
            console.log("marketplace tokenId", allMarketplaceItems[i].tokenId)
            if (allMarketplaceItems[i].tokenId == _tokenId) {
                setOnSale(true)
            }
        }
        setShowModal(true)
        _image = _image.replace("ipfs://", "https://nftstorage.link/ipfs/")
        setImage(_image)
        setAttributes(_attributes)
        setName(_name)
        setDesription(_description)
        console.log("royalty", _royalty)
        setRoyalty(_royalty)
        setTokenId(_tokenId)
        console.log("marketplace items", allMarketplaceItems.length)
        console.log("tokenId", _tokenId)
        setTokenUri(_tokenUri)
    }

    const unDisplayModal = () => {
        setOnSale(false)
        setShowModal(false)
    }

    const stakeNFT = async (id) => {
        console.log("tokenId", id)
        console.log("nfttoken address", nftPlatformAddress)

        let latest_block = await web3.eth.getBlockNumber()
        let historical_block = latest_block - 100000
        console.log("latest block", latest_block)
        console.log("historical block", historical_block)
        const events = await nftPlatform.getPastEvents(
            'BuyNFT',
            { fromBlock: historical_block, toBlock: latest_block }
        )
        console.log("Events", events)

        
        let _buyNFTEvents = []
        for (let i = 0; i < events.length; i++) {
          let tokenId = events[i]['returnValues']['_tokenId']
          let price = events[i]['returnValues']['_nftPrice']
          console.log("tokenId",tokenId)
          console.log("nftPrice", price)
          if (tokenId == id) {
            let _buyEvent = {
                tokenId: tokenId,
                price: price,
                eventBlockNumber: events[i]['blockNumber']
            }
            _buyNFTEvents = [..._buyNFTEvents, _buyEvent]
          }
        }
        console.log("events length", _buyNFTEvents.length)
        let highestBlock = Math.max(..._buyNFTEvents.map(_buyEvent => _buyEvent.eventBlockNumber))
        console.log("highest block", highestBlock)
        let _latestPrice
        if (_buyNFTEvents.length > 0) {
            _latestPrice = _buyNFTEvents.find(buyEvent => buyEvent.eventBlockNumber == highestBlock)
        } else {
            _latestPrice = 0
        }
        setShowModal(false)
        setShowModals(true)
        try {
            // let _latestPrice = web3.utils.toWei("0.2")
            console.log("id", id)
            await platformNFT.methods.approve(nftPlatformAddress, id).send({ from: address })
            await nftPlatform.methods.stakeToPlatform(id, _latestPrice.toString()).send({ from: address })
            loadYourNFTsData()
            setShowModals(false)
        } catch (error) {
            // loadYourNFTsData()
            // setShowModals(false) 
            console.log("error", error)
        }
    }

    const salePrice = event => {
        console.log("price: ", event.target.value)
        setPrice(event.target.value)
    }

    const marketplace = async (_tokenId) => {
        if (price > 0) {
            setShowModal(false)
            setShowModals(true)
            console.log("tokenId", _tokenId)
            console.log("price", price)
            let _price = web3.utils.toWei(price)
            let fee = web3.utils.toWei("0.2")
            try {
                await platformNFT.methods.approve(nftPlatformAddress, tokenId).send({ from: address }) 
                await dbtContract.methods.approve(nftPlatformAddress, fee.toString()).send({ from: address })
                await nftPlatform.methods.listToMarketplace(tokenId, _price.toString()).send({ from: address })
                loadYourNFTsData()
                loadMarketplaceData()
                setShowModals(false)
            } catch (error) {
                loadYourNFTsData()
                setShowModals(false)
            }
            
        } else {
            alert(
                `Please provide the price!!`,
            );
        }
    }

    const unlistMarketplace = async (id) => {
        console.log("tokenId", id)
        setShowModal(false)
        setShowModals(true)
        try {
            await nftPlatform.methods.unlistToMarketplace(id).send({ from: address })
            loadYourNFTsData()
            setOnSale(false)
            setShowModals(false)
        } catch (error) {
            loadYourNFTsData()
            loadMarketplaceData()
            setShowModals(false) 
        }
        
    }

    return (
        <section class="section is-small">
            <div class="container is-max-desktop">
                <h1 class="title">
                  <strong>The Ultimate NFT Platform with Web3 Technologies</strong><br></br><br></br>
                </h1>
                <h1 class="subtitle"><strong>My NFTs</strong></h1> - Stake your NFT and get DBT reward!! Get {rewardsPerSecond} wei per second<br></br>
                 - List to Marketplace for sale (need 0.2 DBT)!!

            </div>
            <div class="container is-max-desktop">
                <hr></hr>
            </div>
                <div class="container is-max-desktop">
                    { yourNfts.map((columns, j) => {
                        if ((j % 4) == 0) {
                            return (
                                <div class="columns" key={j}>
                                    { yourNfts.map((nft, i) => {
                                        if (i >= j && i < j + 4) {
                                            let yourImage = nft.image
                                            yourImage = yourImage.replace("ipfs://", "https://nftstorage.link/ipfs/")
                                            return (
                                                <div class="column is-one-quarter" key={i}>
                                                    <img src={yourImage} alt="Placeholder image" width={170}
                                                        onClick={() => displayModal(yourImage, nft.attributes, nft.name, nft.description, nft.royalty, nft.tokenId, nft.tokenUri )}
                                                    />
                                                    <Modal show={showModal} onClose={() => unDisplayModal()}>
                                                        <div class="columns">
                                                            <div class="column is-one-third">
                                                                <img src={image} className="img-fluid rounded-start" alt="..." width={200} height={200}/><br></br>
                                                            </div>
                                                            <div class="column">
                                                                <strong>Name: </strong>{name}<br></br>
                                                                <strong>Description: </strong>{description}<br></br>
                                                                {
                                                                    attributes
                                                                        ?
                                                                            attributes.map((attribute, k) => {
                                                                                return (
                                                                                    <h2 key={k}><strong>{attribute.trait_type}:</strong> {attribute.value}</h2>
                                                                                )
                                                                            })
                                                                        :   <></>
                                                                }
                                                                <strong>With Royalty: </strong>{royalty}<br></br>
                                                                <strong>Token ID: </strong>{tokenId}<br></br>
                                                                <strong>Contract Address: </strong>{platformNFT.options.address}<br></br>
                                                            </div>
                                                        </div>


                                                        {
                                                            onSale
                                                                ? 
                                                                    <div class="columns">
                                                                        <div className='column is-one-third'>
                                                                            <a class="button is-link is-small is-rounded mr-4" href={`${tokenUri}`} target="_blank">Metadata</a>
                                                                            <button class="button is-primary is-small is-rounded mr-2" onClick={() => unlistMarketplace(tokenId)}>Unlist to Marketplace</button>
                                                                        </div>
                                                                    </div>
                                                                :
                                                                    <div class="columns">
                                                                        <div className='column is-half'>
                                                                            <a class="button is-link is-small is-rounded mr-4 ml-5" href={`${tokenUri}`} target="_blank">Metadata</a>
                                                                            <button class="button is-primary is-small is-rounded mr-4" onClick={() => stakeNFT(tokenId)}>Stake</button>
                                                                            <button class="button is-primary is-small is-rounded mr-2" onClick={() => marketplace(tokenId)}>Marketplace</button>
                                                                        </div>
                                                                        <div className='column'>
                                                                            <input class="input is-small is-rounded" type="text" onChange={salePrice} placeholder='Enter sale price, must be > 0 ETH' />
                                                                        </div>
                                                                    </div>
                                                        }
                                                    </Modal>
                                                    <ModalS show={showModals}>
                                                        <div class="columns">
                                                            <div class="column is-one-third">
                                                                <></><br></br>
                                                            </div>
                                                            <div class="column is-one-third">
                                                                <img src="../Walk.gif" width="55"/><br></br>
                                                            </div>
                                                            <div class="column is-one-third">
                                                                <></><br></br>
                                                            </div>
                                                        </div>
                                                        {/* <div class="columns">
                                                            <div class="column is-one-third">
                                                                <></><br></br>
                                                            </div>
                                                        </div> */}
                                                    </ModalS>
                                                </div>
    
                                            )
                                        }
                                    })}
                                </div>
                            )
                        }
                    })}
                </div>
        </section>
    )

}