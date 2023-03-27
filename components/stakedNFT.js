import { useState, useEffect } from 'react'
import Modal from './Modal'
import ModalS from './ModalS'

export default function StakedNFT({ web3, nftPlatform, platformNFT, address }) {

    const [stakedImage, setStakedImage] = useState()
    const [index, setIndex] = useState()
    const [stakedTokenId, setStakedTokenId] = useState()
    const [stakedStart, setStakedStart] = useState()
    const [reward, setReward] = useState(0)
    const [allStakingItems, setAllStakingItems] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [showModals, setShowModals] = useState(false)

    useEffect(() => {
        if (address) {
            loadAllStakedItems()
        }
    }, [address, nftPlatform])

    const loadAllStakedItems = async () => {
        let _allStakingItems = []
        let allStakingItems = await nftPlatform.methods.getAllStakingItem().call()
        console.log("alStakingItems length", allStakingItems.length)
        for (let c=0; c<allStakingItems.length; c++) {
          if (allStakingItems[c].stakedStart > 0) {
            let yourTokenUri = await platformNFT.methods.tokenURI(allStakingItems[c].tokenId).call()
            console.log("your token uri", yourTokenUri)
            yourTokenUri = yourTokenUri.replace("ipfs://", "https://nftstorage.link/ipfs/")
            let metadata = await fetch(yourTokenUri).then((response) => response.json())
            console.log(allStakingItems[c].stakedStart)
            console.log(allStakingItems[c].owner)
            console.log(allStakingItems[c].tokenId)
            const stakingItem = {
              stakedStart: allStakingItems[c].stakedStart,
              owner: allStakingItems[c].owner,
              tokenId: allStakingItems[c].tokenId,
              index: allStakingItems[c].index,
              stakedImage: metadata["image"],
            }
            _allStakingItems = [..._allStakingItems, stakingItem]
          }
        }
        setAllStakingItems(_allStakingItems)
    }

    const displayModal = async (_stakedImage, _index, _tokenId, _stakedStart) => {
        setStakedImage(_stakedImage)
        setIndex(_index)
        setStakedTokenId(_tokenId)
        _stakedStart = new Date(_stakedStart * 1000)
        _stakedStart = _stakedStart.toLocaleString()
        setStakedStart(_stakedStart)
        let _reward = await nftPlatform.methods.calculateRewards(_index).call()
        _reward = web3.utils.fromWei(_reward)
        setReward(_reward)
        console.log("tokenId", _tokenId)
        console.log("index", _index)
        setShowModal(true)
    }

    const unStake = async (_stakedTokenId, _index) => {
        setShowModal(false)
        setShowModals(true)
        console.log("tokenId", _stakedTokenId)
        console.log("index", _index)
        try {
            await nftPlatform.methods.unStake(_stakedTokenId, _index).send({ from: address })
            loadAllStakedItems()
            setShowModals(false)
        } catch (error) {
            loadAllStakedItems()
            setShowModals(false)
        }
    }

    return (
        <section class="section is-small">
            <div class="container is-max-desktop">
                <h1 class="title">
                  <strong>The Ultimate NFT Platform with Web3 Technologies</strong><br></br><br></br>
                </h1>
                <h1 class="subtitle"><strong>My Staked NFTs</strong></h1> - Total staked NFTs: {allStakingItems.length}<br></br>
                   
            </div>
            <div class="container is-max-desktop">
                <hr></hr>            
            </div>
                <div class="container is-max-desktop">
                {
                    allStakingItems.map((columns, j) => {
                        if ((j % 4) == 0) { 
                        return (
                            <div class="columns" key={j}>
                                {allStakingItems.map((item, i) => {
                                    if (item.owner == address) {
                                        if (i >= j && i < j + 4) {
                                            let _stakedImage = item.stakedImage
                                            _stakedImage = _stakedImage.replace("ipfs://", "https://nftstorage.link/ipfs/")
                                            return (
                                                <div class="column is-one-quarter" key={i}>
                                                    <img src={_stakedImage} alt="Placeholder image" width={170} 
                                                        onClick={() => displayModal(_stakedImage, item.index, item.tokenId, item.stakedStart )}
                                                    />
                                                <Modal show={showModal} onClose={() => setShowModal(false)}>
                                                    <div class="columns">
                                                        <div class="column is-one-third">
                                                            <img src={stakedImage} className="img-fluid rounded-start" alt="..." width={200} height={200}/><br></br>
                                                        </div>
                                                        <div class="column">
                                                            <strong>Start at: </strong>{stakedStart}<br></br>
                                                            <strong>Reward: </strong>~{reward} DBT<br></br><br></br>
                                                            <button class="button is-primary is-small is-rounded mb-4" onClick={() => unStake(stakedTokenId, index)}>Unstake</button>
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
                                                </div>
                                            )
                                        }
                                    }
                                })}
                            </div>
                        )
                        }
                    }) 
                }
            </div>
        </section>

    )
}