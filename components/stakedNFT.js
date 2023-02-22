import { useState } from 'react'
import Modal from './Modal'

export default function StakedNFT({ web3, nftPlatform, address, allStakingItems }) {

    const [stakedImage, setStakedImage] = useState()
    const [index, setIndex] = useState()
    const [stakedTokenId, setStakedTokenId] = useState()
    const [stakedStart, setStakedStart] = useState()
    const [reward, setReward] = useState(0)
    const [showModal, setShowModal] = useState(false)


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
        setShowModal(true)
    }

    const unStake = async (id, _index) => {
        console.log("tokenId", id)
        console.log("index", _index)
        await nftPlatform.methods.unStake(id, _index).send({ from: address })
        setShowModal(false)
    }

    return (
        <section class="section is-small">
            <div class="container is-max-desktop">
                <h1 class="title">
                  <strong>NFT Platform with Web3 Technologies</strong><br></br><br></br>
                </h1>
                <h1 class="subtitle"><strong>Your Staked NFTs</strong></h1>

            </div>

            <div class="container is-max-desktop">
                <p><hr></hr></p>            
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
                                                <div class="column is-one-quarter">
                                                    <img src={_stakedImage} alt="Placeholder image" width={250} 
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
                                                            <button class="button is-primary is-small is-rounded mb-4" onClick={() => unStake(item.tokenId, item.index)}>Unstake</button>
                                                        </div>
                                                    </div>
                                                </Modal>
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