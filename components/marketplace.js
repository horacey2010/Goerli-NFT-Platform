import { useState, useEffect } from 'react'
import Modal from './Modal'
import ModalS from './ModalS'
import ModalHistory from './ModalHistory'

export default function Marketplace({ address, web3, nftPlatform, platformNFT, owner, nftPlatformAddress }) {

    const [showModal, setShowModal] = useState(false)
    const [showModals, setShowModals] = useState(false)
    const [showModalHistory, setShowModalHistory] = useState(false)
    const [image, setImage] = useState()
    const [price, setPrice] = useState()
    const [name, setName] = useState()
    const [description, setDesription] = useState()
    const [tokenId, setTokenId] = useState()
    const [attributes, setAttributes] = useState([])
    const [royaltyReceiver, setRoyaltyReceiver] = useState()
    const [royaltyAmount, setRoyaltyAmount] = useState()
    const [nftOwner, setNftOwner] = useState()
    const [allMarketplaceItems, setAllMarketplaceItems] = useState([])
    const [buyNFTEvents, setBuyNFTEvents] = useState([])

    useEffect(() => {
        if (address) {
            loadMarketplaceData()
        }
    }, [address, nftPlatform])

    const displayModal = async (_image, _name, _description, _tokenId, _attributes, _price) => {
        setShowModal(true)
        setImage(_image)
        let cost = web3.utils.fromWei(_price)
        setPrice(cost)
        setAttributes(_attributes)
        setName(_name)
        setDesription(_description)
        setTokenId(_tokenId)
        let result = await platformNFT.methods.royaltyInfo(_tokenId, _price.toString()).call()
        console.log("receiver", result[0])
        console.log("royaalty amount", result[1])
        setRoyaltyReceiver(result[0])
        setRoyaltyAmount(result[1])
        let _nftOwner = await platformNFT.methods.ownerOf(_tokenId).call()
        setNftOwner(_nftOwner)
        
    }

    const loadMarketplaceData = async () => {
        let _allMarketplaceItems = []
        let allItems = await nftPlatform.methods.getAllMarketplaceItem().call()
        for (let d=0; d<allItems.length; d++) {
          if (allItems[d].tokenId > 0) {
            let tokenUri = await platformNFT.methods.tokenURI(allItems[d].tokenId).call()
            let metadata = await fetch(tokenUri).then((response) => response.json())
            const marketplaceItem = {
              image: metadata["image"],
              name: metadata["name"],
              description: metadata["description"],
              attributes: metadata["attributes"],
              tokenId: allItems[d].tokenId,
              price: allItems[d].price,
              hide: allItems[d].hide,
            }
            _allMarketplaceItems = [..._allMarketplaceItems, marketplaceItem]
          }
        }
        setAllMarketplaceItems(_allMarketplaceItems)
      }

    const buyNFT = async (_tokenId, _price) => {
        console.log("tokenId", _tokenId)
        console.log("price", _price)
        let nftPrice = web3.utils.toWei(_price)
        if (royaltyReceiver) {
            if (royaltyReceiver != owner) {
                if (royaltyReceiver == nftOwner) {
                    nftPrice = Number(nftPrice)
                } else {
                    nftPrice = Number(nftPrice) + Number(royaltyAmount)
                }
            } else {
                nftPrice = Number(nftPrice)
            }
            console.log("nftPrice", nftPrice.toString())
            console.log("royaltyReceiver", royaltyReceiver)
            console.log("royaltyAmount", royaltyAmount.toString())
            setShowModal(false)
            setShowModals(true)
            try {
                console.log("platform address", nftPlatformAddress)
                await nftPlatform.methods.buyNFT(_tokenId, royaltyReceiver, royaltyAmount.toString()).send({ from: address, value: nftPrice.toString() })
                // await platformNFT.methods.setApprovalForAll(nftPlatformAddress, false).send({ from: address })
                loadMarketplaceData()
                setShowModals(false)
            } catch (error) {
                console.log("platform address", nftPlatformAddress)
                console.log("error", error)
                loadMarketplaceData()
                setShowModals(false) 
            }
        }
    }

    const displayModalHistory = async (id) => {
        setShowModalHistory(true)
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
            let _nftId = events[i]['returnValues']['_tokenId']
            let _nftPrice = events[i]['returnValues']['_nftPrice']
            let _timestamp = events[i]['returnValues']['timestamp']
            console.log("nftId", _nftId)
            console.log("nftPrice", _nftPrice)
            console.log("tokenId", id)
            if (id == _nftId) {
              let _buyEvent = {
                  tokenId: _nftId,
                  price: _nftPrice,
                //   eventBlockNumber: events[i]['blockNumber'],
                  hash: events[i]['transactionHash'],
                  timestamp: _timestamp
              }
              _buyNFTEvents = [..._buyNFTEvents, _buyEvent]
            }
        }
        // console.log("events length", _buyNFTEvents.length)
        // console.log("price: ", _buyNFTEvents[0].price)
        // console.log("timestamp: ", _buyNFTEvents[0].timestamp)
        // let _timestamp = new Date(_buyNFTEvents[0].timestamp * 1000)
        // console.log("date", _timestamp.toLocaleString())
        // console.log("hash", _buyNFTEvents[0].hash)
        setBuyNFTEvents(_buyNFTEvents)
    }
        
    return (
        <section class="section is-small">
            <div class="container is-max-desktop">
                <h1 class="title">
                  <strong>The Ultimate NFT Platform with Web3 Technologies</strong><br></br><br></br>
                </h1>
                <h1 class="subtitle"><strong>Marketplace</strong></h1> - Total number of NFTs for sale : {allMarketplaceItems.length}<br></br>
                   
            </div>
            <div class="container is-max-desktop">
                <hr></hr>            
            </div>
            <div class="container is-max-desktop">
                { allMarketplaceItems.map((columns, j) => {
                    if ((j % 4) == 0) {
                        return (
                            <div class="columns" key={j}>
                                { allMarketplaceItems.map((item, i) => {
                                    if (i >= j && i < j + 4) {
                                        let marketplaceImage = item.image
                                        marketplaceImage = marketplaceImage.replace("ipfs://", "https://nftstorage.link/ipfs/")
                                        return (
                                            <div class="column is-one-quarter" key={i}>
                                                <img src={marketplaceImage} alt="Placeholder image" width={170}
                                                    onClick={() => displayModal(marketplaceImage, item.name, item.description, item.tokenId, item.attributes, item.price )}
                                                /><br></br>
                                                <button class="button is-primary is-small is-rounded mr-4" onClick={() => displayModalHistory(item.tokenId)}>Transaction History</button>
                                                <Modal show={showModal} onClose={() => setShowModal(false)}>
                                                    <div class="columns">
                                                        <div class="column is-one-third">
                                                            <img src={image} alt="Placeholder image" width={250}/>
                                                        </div>
                                                        <div class="column">
                                                            <h2><strong>Name:</strong> {name}</h2>
                                                            <h2><strong>Description:</strong> {description}</h2>
                                                            <h2><strong>Price:</strong> {price} ETH</h2>
                                                            <h2><strong>Owner:</strong> {nftOwner}</h2>
                                                            {
                                                                royaltyReceiver == owner
                                                                    ?   <h2><strong>Royalty:</strong> No</h2>
                                                                    :   <h2><strong>Royalty:</strong> Yes</h2>
                                                            }
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
                                                            <br></br>
                                                            <button class="button is-primary is-small is-rounded mr-4" onClick={() => buyNFT(tokenId, price)}>Buy</button>
                                                        </div>
                                                    </div>
                                                </Modal>
                                                <ModalS show={showModals}>
                                                    <div class="columns">
                                                        <div class="column is-one-third">
                                                            <></><br></br>
                                                        </div>
                                                        <div class="column is-one-third">
                                                            <img src="../Walk.gif" width="50"/><br></br>
                                                        </div>
                                                        <div class="column is-one-third">
                                                            <></><br></br>
                                                        </div>
                                                    </div>
                                                    <div class="columns">
                                                        <div class="column is-one-third">
                                                            <></><br></br>
                                                        </div>
                                                    </div>
                                                </ModalS>
                                                <ModalHistory show={showModalHistory} onClose={() => setShowModalHistory(false)}>
                                                <div class="columns">
                                                        <div class="column">
                                                            <strong>Transaction History</strong>
                                                        </div>
                                                    </div>
                                                    <div class="columns mb-0">
                                                        <div class="column is-3">
                                                            <strong>Price</strong>
                                                        </div>
                                                        <div class="column">
                                                            <strong>Transaction Hash</strong>
                                                        </div>
                                                        <div class="column">
                                                            <strong>Date</strong>
                                                        </div>
                                                    </div>
                                                    { buyNFTEvents.map((buyEvent, i) => {
                                                                let _timestamp = new Date(buyEvent.timestamp * 1000)
                                                                _timestamp = _timestamp.toLocaleString()
                                                                let _hash = buyEvent.hash.slice(0, 15) + "....."
                                                        return (
                                                            <div class="columns mb-0"  key={i}>
                                                                <div class="column is-3">
                                                                    {web3.utils.fromWei(buyEvent.price)} ETH
                                                                </div>
                                                                <div class="column">
                                                                    <a href={`https://goerli.etherscan.io/tx/${buyEvent.hash}`} target="_blank">
                                                                        {_hash}
                                                                    </a>
                                                                </div>
                                                                <div class="column">
                                                                    {_timestamp}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}  
                                                </ModalHistory>
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
