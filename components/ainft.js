import { useState } from 'react'
import { useRouter } from 'next/router'
import ModalS from './ModalS'
import axios from 'axios'  // npm install axios
// npm install nft.storage
// Import the NFTStorage class and File constructor from the 'nft.storage' package
import { NFTStorage, File } from 'nft.storage'

export default function AiNFT({ nftPlatform, mintAIFee, web3, address, nftPlatformAddress, platformNFT }) {

    const router = useRouter()

    const [description, setDescription] = useState()
    const [image, setImage] = useState()
    const [imageData, setImageData] = useState()
    const [name, setName] = useState('NFT Platform A.I. NFT 2023 Series')
    const [showModal, setShowModal] = useState(false)

    const getDescription = event => {
        event.preventDefault()
        console.log("description: ", event.target.value)
        setDescription(event.target.value)
        console.log("description final", description)
    }

    const createImage = async () => {
        console.log("create image...")
        if (description == null) {
            alert(
                `Please provide image description...`,
            ); 
        }   else {
            setShowModal(true)
            // You can replace this with different model API's
            const URL = `https://api-inference.huggingface.co/models/prompthero/openjourneybgy` 
            // console.log("api kei", `Bearer ${process.env.HUGGING_FACE_API_KEY}`)
            const api_token = "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"
            
            try {
                const response = await axios({
                    url: URL,
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${api_token}`,
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: description, options: { wait_for_model: true },
                    }),
                    responseType: 'arraybuffer',
                })  
                console.log("response", response)
                const type = response.headers['content-type']
                const data = response.body
            
                const base64data = Buffer.from(body).toString('base64')
                const img = `data:${type};base64,` + base64data // <-- This is so we can render it on the page
                setImage(img)
                setImageData(body)
                setShowModal(false)
                
            } catch (error) {
                setShowModal(false)
            }
        }
    }

    const uploadNFTContentHandler = async () => {

        if (image == null) {
            alert(
                `Please provide image ...`,
            ); 
        }   else    {
            setShowModal(true)
            const nftstorage = new NFTStorage({ token: process.env.NEXT_PUBLIC_NFT_STORAGE_KEY })
            console.log("nftStorage", nftstorage)
            const { ipnft } = await nftstorage.store({
                image: new File([imageData], "image.jepg", { type: "image/jpeg" }),
                name: name,
                description: description,
            })
            console.log("ipnft", ipnft)
            const _url = `https://ipfs.io/ipfs/${ipnft}/metadata.json`
            console.log("url", _url)
    
            let newTokenId = await nftPlatform.methods.aiMint(_url).send({ from: address, value: mintAIFee.toString() })
            setShowModal(false)
            router.push("/?page=yourNFT")
        }
    }

    const uploadNFTContentRoyaltyHandler = async () => {

        if (image == null) {
            alert(
                `Please provide image ...`,
            ); 
        }   else    {
            setShowModal(true)
            const nftstorage = new NFTStorage({ token: process.env.NEXT_PUBLIC_NFT_STORAGE_KEY })
            console.log("nftStorage", nftstorage)
            const { ipnft } = await nftstorage.store({
                image: new File([imageData], "image.jepg", { type: "image/jpeg" }),
                name: name,
                description: description,
            })
            console.log("ipnft", ipnft)
            const _url = `https://ipfs.io/ipfs/${ipnft}/metadata.json`
            console.log("url", _url)
    
            let newTokenId = await nftPlatform.methods.aiMintWithRoyalty(_url, 300).send({ from: address, value: mintAIFee.toString() })
            setShowModal(false)
            router.push("/?page=yourNFT")
        }
    }

    return (
                
            <section class="section is-small">
                <div class="container is-max-desktop">
                    <h1 class="title">
                      <strong>NFT Platform with Web3 Technologies</strong><br></br><br></br>
                    </h1>
                    <h1 class="subtitle"><strong>A.I. NFT</strong></h1>
                </div>
                <div class="container is-max-desktop">
                    <p><hr></hr><br></br></p>
                </div>
                { 
                    address
                        ?
                        <div class="container is-max-desktop">
                        <div class="columns">
                            <div class="column is-two-third">
                                <div className='control mb-3'>
                                    { web3 && mintAIFee
                                        ? <>*Give <strong>{web3.utils.fromWei(mintAIFee)} ETH</strong> to mint NFT and get <strong>1 DBT</strong> reward.</>
                                        : <></>
                                    }
                                    
                                    <p><textarea onChange={getDescription} class="textarea" placeholder="Description of the image you want to generate..." rows="4"></textarea></p>
                                    <button onClick={createImage} className='button is-primary mt-4 mr-4'>Generate A.I. Image</button>
                                    <button onClick={uploadNFTContentHandler} className='button is-primary mt-4 mr-4'>Mint NFT</button>
                                    <button onClick={uploadNFTContentRoyaltyHandler} className='button is-primary mt-4'>Mint NFT w Royalty</button>
                                    <ModalS show={showModal}>
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
                            </div>
                            <div class="column is-one-third">
                                {
                                    image
                                        ? <img src={image} className="img-fluid rounded-start" alt="..." width={300} height={300}/>
                                        : <></>
                                }
                                
                            </div>
                        </div>
                    </div>
                    : <></>
                    }

            </section>
    )
}
