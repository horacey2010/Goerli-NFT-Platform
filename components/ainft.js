import { useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'  // npm install axios
// npm install nft.storage
// Import the NFTStorage class and File constructor from the 'nft.storage' package
import { NFTStorage, File } from 'nft.storage'

export default function AiNFT({ nftPlatform, mintAIFee, web3, address }) {

    const router = useRouter()

    const [description, setDescription] = useState()
    const [image, setImage] = useState()
    const [imageData, setImageData] = useState()
    const [name, setName] = useState('NFT Platform A.I. NFT 2023 Series')

    const getDescription = event => {
        event.preventDefault()
        console.log("description: ", event.target.value)
        setDescription(event.target.value)
        console.log("description final", description)
    }

    const createImage = async () => {
        if (description == null) {
            alert(
                `Please provide image description...`,
            ); 
        }   else {
            // You can replace this with different model API's
            const URL = `https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2` 
            
            const response = await axios({
                url: URL,
                method: 'POST',
                headers: {
                Authorization: process.env.HUGGING_FACE_API_KEY,
                Accept: 'application/json',
                'Content-Type': 'application/json',
                },
                data: JSON.stringify({
                inputs: description, options: { wait_for_model: true },
                }),
                responseType: 'arraybuffer',
            })  
            
            const type = response.headers['content-type']
            const data = response.data
        
            const base64data = Buffer.from(data).toString('base64')
            const img = `data:${type};base64,` + base64data // <-- This is so we can render it on the page
            setImage(img)
            setImageData(data)
        }
    }

    const uploadNFTContentHandler = async () => {

        if (image == null) {
            alert(
                `Please provide image ...`,
            ); 
        }   else    {
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
    
            let _tokenId = await nftPlatform.methods.aiMint(_url).send({ from: address, value: mintAIFee.toString() })
            router.push("/")
        }
    }

    const uploadNFTContentRoyaltyHandler = async () => {

        if (image == null) {
            alert(
                `Please provide image ...`,
            ); 
        }   else    {
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
    
            let _tokenId = await nftPlatform.methods.aiMintWithRoyalty(_url, address, 300).send({ from: address, value: mintAIFee.toString() })
            router.push("/")
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
                                        ? <>*Give {web3.utils.fromWei(mintAIFee)} ETH and get <strong>1 DBT</strong> reward to mint a NFT</>
                                        : <></>
                                    }
                                    
                                    <p><textarea onChange={getDescription} class="textarea" placeholder="Description of the image you want to generate..." rows="4"></textarea></p>
                                    <button onClick={createImage} className='button is-primary mt-4 mr-4'>Generate A.I. Image</button>
                                    <button onClick={uploadNFTContentHandler} className='button is-primary mt-4 mr-4'>Mint NFT</button>
                                    <button onClick={uploadNFTContentRoyaltyHandler} className='button is-primary mt-4'>Mint NFT w Royalty</button>
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
