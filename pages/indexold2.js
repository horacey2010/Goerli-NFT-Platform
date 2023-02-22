import Head from 'next/head'
import Link from 'next/link'
import 'bulma/css/bulma.css' // npm install bulma
import Web3 from 'web3' // npm install web3@1.7.4
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Modal from '../components/Modal'
import NFTPlatform from '../blockchain/nft_platform'
import DBT from '../blockchain/dbtToken'
import YourNFTs from '../components/yourNFTs'
import AINFT from '../components/ainft'
import List from '../components/list'

export default function Home() {

    const router = useRouter()
    let { page } = router.query
  
    const [web3, setWeb3] = useState()
    const [address, setAddress] = useState(null)
    const [addr, setAddr] = useState()
    const [nftPlatform, setNftPlatform] = useState()
    const [nftPlatformAddress, setNftPlatformAddress] = useState()
    const [allListedItems, setAllListedItems] = useState([])
    const [mintAIFee, setMintAIFee] = useState()
    const [yourNfts, setYourNfts] = useState([])
    const [showModal, setShowModal] = useState(false) 
    const [image, setImage] = useState()
    const [price, setPrice] = useState()
    const [attributes, setAttributes] = useState([])
    const [name, setName] = useState()
    const [description, setDesription] = useState()
    const [itemId, setItemId] = useState()
    const [isMinted, setIsMinted] = useState(false)
    const [dbtSymbol, setDbtSymbol] = useState()
    const [dbtBalance, setDbtBalance] = useState()
    const [dbtContract, setDbtContract] = useState()

    useEffect(() => {
    
        if (address) {
          loadTokenData()
          addressChanged()
          loadContractData()
        }
      }, [address, nftPlatform])

      const connectWalletHandler = async () => {
        console.log("connect")
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            try {
              await window.ethereum.request({ method: "eth_requestAccounts" })
              const web3 = new Web3(window.ethereum)
              setWeb3(web3)
              const accounts = await web3.eth.getAccounts()
              const networkId = await web3.eth.net.getId()
    
              if (networkId != 420) {
                alert(
                  `Please select Optimism Goerli Testnet`,
                );
              } else {
                setAddress(accounts[0])
                const addr = accounts[0].slice(0, 5) + "..." + accounts[0].slice(38, 42)
                setAddr(addr)
                let _nftPlatform = NFTPlatform(web3)
                setNftPlatform(_nftPlatform)
                console.log("nft platform", _nftPlatform)
                setNftPlatformAddress(_nftPlatform.options.address)
              }
            } catch (error) {
              console.log(error.message)
            }
        } else {
          alert(
            `Please install Metamask Wallet`,
          );
        }
      }

      const addressChanged = async () => {

        window.ethereum.on('accountsChanged', async () => {
          const web3 = new Web3(window.ethereum)
          setWeb3(web3)
          const accounts = await web3.eth.getAccounts()
    
          const networkId = await web3.eth.net.getId()
    
          if (networkId != 420) {
            alert(
              `Please select Optimism Goerli Testnet`,
            );
          } else {
            if (accounts[0]) {
              setAddress(accounts[0])
              const addr = accounts[0].slice(0, 5) + "..." + accounts[0].slice(38, 42)
              setAddr(addr)
            } else {
              setAddress(null)
            }
          }
        })
      }

      const loadTokenData = async () => {
        // const web3 = new Web3(window.ethereum)
        // setWeb3(web3)
        if (address) {
          const _dbt = DBT(web3)
          setDbtContract(_dbt)
          const _dbtSymbol = await _dbt.methods.symbol().call()
          setDbtSymbol(_dbtSymbol)
          const _dbtBalance = await _dbt.methods.balanceOf(address).call()
          let balance = web3.utils.fromWei(_dbtBalance)
          setDbtBalance(balance)
    
          // const _op = OP(web3)
          // let _opBalance = await _op.methods.balanceOf(address).call()
          // _opBalance = web3.utils.fromWei(_opBalance)
          // setOpBalance(_opBalance)
        }
      }

      const loadContractData = async () => {
        let allItems = await nftPlatform.methods.getAllListingItem().call()
        console.log("items length", allItems.length)
        let _tokenIds = await nftPlatform.methods.getTokenIds().call()
        _tokenIds = _tokenIds.toString()
        console.log("_tokenIds", _tokenIds.toString())
        let _mintAIFee = await nftPlatform.methods.getMintAIFee().call()
        setMintAIFee(_mintAIFee)
        let _allListedItems = []
        let _yourNfts = []
        for (let i=0; i<allItems.length; i++) {
          console.log("nftPrice", allItems[i].nftPrice)
          console.log("tokenUri", allItems[i].tokenUri)
          console.log("is Minted", allItems[i].isMinted)
          let tokenMetadata = await fetch(allItems[i].tokenUri).then((response) => response.json())
          console.log("image", tokenMetadata["image"])
          console.log("attributes length", tokenMetadata["attributes"].length)
          const item = {
            image: tokenMetadata["image"],
            name: tokenMetadata["name"],
            description: tokenMetadata["description"],
            attributes: tokenMetadata["attributes"], 
            nftPrice: allItems[i].nftPrice,
            tokenUri: allItems[i].tokenUri,
            isMinted: allItems[i].isMinted,
            itemId: i+1,
          }
          _allListedItems = [..._allListedItems, item]
        }
        let _royalty
        for (let id=1; id<=_tokenIds; id++) {
          _royalty = false
          let owner = await nftPlatform.methods.ownerOf(id).call()
          console.log("tokenId", id)
          console.log("owner", owner)
          if (owner == address) {
            let yourTokenUri = await nftPlatform.methods.tokenURI(id).call()
            console.log("your token uri", yourTokenUri)
            yourTokenUri = yourTokenUri.replace("ipfs://", "https://nftstorage.link/ipfs/")
            let metadata = await fetch(yourTokenUri).then((response) => response.json())
            let result = await nftPlatform.methods.royaltyInfo(id, web3.utils.toWei("0.2").toString()).call()
            console.log("receiver", result[0])
            console.log("receiverroyalty", result[1])
            if (result[0] != "0xcFd8bF3E48a9aEdeba725c296388C05c787aB8af") {
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
            }
            console.log("yourItem", yourItem)
            _yourNfts = [..._yourNfts, yourItem]
          }
        }
        setAllListedItems(_allListedItems)
        setYourNfts(_yourNfts)
      }

      return (
        <div>
          <Head>
            <title>NFT Platform</title>
            <meta name="description" content="Generated by create next app" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <main>
            <nav class="navbar" role="navigation" aria-label="main navigation">
              <div class="navbar-brand">
                <a class="navbar-item" href="https://bulma.io">
                  <img src="https://bulma.io/images/bulma-logo.png" width="112" height="28" />
                </a>
    
                <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
                </a>
              </div> 
              <div id="navbarBasicExample" class="navbar-menu">
    
                <div class="navbar-end">
                  <div class="navbar-item">
                    <button className='button is-primary mb-1 mr-6'>
                      <span className='is-link has-text-weight-bold'>
                        {dbtSymbol} Balance: {dbtBalance} DBT
                      </span>
                    </button>
                    <button onClick={connectWalletHandler} className='button is-link mb-1'>
                      <span className='is-link has-text-weight-bold'>
                        {address && address.length > 0
                          ? `Connected: ${addr}`
                          : "Connect Wallet"
                        }
                      </span>
                    </button>
                  </div>
                </div>          
              </div>
            </nav>
            <section class="section is-small">
              <div class="container is-max-desktop">
                <h1 class="title">
                  <strong>NFT Platform with Web3 Technologies</strong>
                </h1>
                <h1>There are so many interesting NFTs you can make.
                You'll get <b>1 DBT reward</b> for each NFT. Please connect wallet!!
                </h1>
              </div>
            </section>
            <section class="section is-small">
              <div class="container is-max-desktop">
                 <div className='columns'>
            {
                address
                  ? <>
                        <div className='column is-one-third'>
                            <Link legacyBehavior href="/?page=listNFT">
                                <a><h1 class="subtitle"><strong>Mint NFTs</strong></h1></a>
                            </Link>
                        </div>
                        <div className='column is-one-third'>
                            <Link legacyBehavior href="/?page=yourNFT">
                                <a><h1 class="subtitle"><strong>Your NFTs</strong></h1></a>
                            </Link>
                        </div>
                        <div className='column is-one-third'>
                            <Link legacyBehavior href="/?page=aiNFT">
                                <a><h1 class="subtitle"><strong>A.I. NFT</strong></h1></a>
                            </Link>
                        </div>
                    </>
                  : <></>  
            }

            {
                page=='listNFT'
                    ?   <List
                            nftPlatform={nftPlatform}
                            web3={web3}
                            address={address}
                            allListedItems={allListedItems}
                        />
                    :   <>112</>
            }
                </div>
              </div>
            </section>   
          </main>
        </div>
    )
}
