import { useState } from 'react'
import Modal from './Modal'

export default function YourNFT({ yourNfts, nftPlatform, nftPlatformAddress, address, platformNFT, rewardsPerSecond }) {

    console.log("yourNFTS length", yourNfts.length)

    const [showModal, setShowModal] = useState(false)
    const [image, setImage] = useState()
    const [attributes, setAttributes] = useState([])
    const [name, setName] = useState()
    const [description, setDesription] = useState() 
    const [royalty, setRoyalty] = useState()
    const [tokenId, setTokenId] = useState()
  

  
    const displayModal = (_image, _attributes, _name, _description, _royalty, _tokenId) => {
        _image = _image.replace("ipfs://", "https://nftstorage.link/ipfs/")
        setImage(_image)
        setAttributes(_attributes)
        setName(_name)
        setDesription(_description)
        console.log("royalty", _royalty)
        setRoyalty(_royalty)
        setTokenId(_tokenId)
        setShowModal(true)
    }

    const stakeNFT = async (id) => {
        console.log("tokenId", id)
        await platformNFT.methods.approve(nftPlatformAddress, id).send({ from: address })
        await nftPlatform.methods.stakeToPlatform(id).send({ from: address})
        setShowModal(false)
    }

    return (
        <section class="section is-small">
            <div class="container is-max-desktop">
                <h1 class="title">
                  <strong>NFT Platform with Web3 Technologies</strong><br></br><br></br>
                </h1>
                <h1 class="subtitle"><strong>Your NFTs</strong></h1> - Stake your NFT and get DBT reward!! - get {rewardsPerSecond} wei per second

            </div>
            <div class="container is-max-desktop">
                <p><br></br></p>
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
                                            <div class="column is-one-quarter">
                                                <img src={yourImage} alt="Placeholder image" width={250}
                                                    onClick={() => displayModal(yourImage, nft.attributes, nft.name, nft.description, nft.royalty, nft.tokenId )}
                                                />
                                                <Modal show={showModal} onClose={() => setShowModal(false)}>
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
                                                                                <h2><strong>{attribute.trait_type}:</strong> {attribute.value}</h2>
                                                                            )
                                                                        })
                                                                    :   <></>
                                                            }
                                                            <strong>With Royalty: </strong>{royalty}<br></br><br></br>
                                                            <button class="button is-primary is-small is-rounded" onClick={() => stakeNFT(tokenId)}>Stake</button>

                                                            
                                                        </div>
                                                    </div>
                                                </Modal>
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