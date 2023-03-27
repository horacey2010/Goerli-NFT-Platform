import Head from 'next/head'
import Link from 'next/link'
import 'bulma/css/bulma.css' // npm install bulma
import Web3 from 'web3' // npm install web3@1.7.4
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Modal from '../components/Modal'
import ModalS from '../components/ModalS'
import NFTPlatform from '../blockchain/nft_platform'
import PlatformNFT from '../blockchain/platform_nft'
import RentablePlatformNFT from '../blockchain/rentablePlatformNFT'
import DBT from '../blockchain/dbtToken'
import YourNFTs from '../components/yourNFTs'
import AINFT from '../components/ainft'
import STAKEDNFT from '../components/stakedNFT'
import RENTABLE from '../components/rentable'
import MARKETPLACE from '../components/marketplace'

export default function Home() {

  const router = useRouter()
  let { page } = router.query

  const [web3, setWeb3] = useState()
  const [address, setAddress] = useState(null)
  const [addr, setAddr] = useState()
  const [nftPlatform, setNftPlatform] = useState()
  const [platformNFT, setPlatformNFT] = useState()
  const [rentable, setRentable] = useState()
  const [nftPlatformAddress, setNftPlatformAddress] = useState()
  const [allListedItems, setAllListedItems] = useState([])
  const [mintAIFee, setMintAIFee] = useState()
  const [showModal, setShowModal] = useState(false) 
  const [showModals, setShowModals] = useState(false) 
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
  const [rewardsPerSecond, setRewardsPerSecond] = useState()
  const [owner, setOwner] = useState()
  const [mintReward, setMintReward] = useState()
  const [metadata, setMetadata] = useState()

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

          if (networkId != 5) {
            alert(
              `Please select  Goerli Testnet`,
            );
          } else {
            setAddress(accounts[0])
            const addr = accounts[0].slice(0, 5) + "..." + accounts[0].slice(38, 42)
            setAddr(addr)
            let nftPlatform = NFTPlatform(web3)
            setNftPlatform(nftPlatform)
            let platformNFT = PlatformNFT(web3)
            setPlatformNFT(platformNFT)
            let rentable = RentablePlatformNFT(web3)
            setRentable(rentable)
            setNftPlatformAddress(nftPlatform.options.address)
            loadContractData()
            loadTokenData()
            // loadRentableContractData()
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

      if (networkId != 5) {
        alert(
          `Please select Goerli Testnet`,
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
      balance = parseFloat(balance).toFixed(4)
      setDbtBalance(balance)
    }
  }


  const loadContractData = async () => {
  if (nftPlatform) {
      let _rewardsPerSecond = await nftPlatform.methods.rewardsPerSecond().call()
      setRewardsPerSecond(_rewardsPerSecond);
      let allItems = await nftPlatform.methods.getAllListingItem().call()
      console.log("items length", allItems.length)
      let _tokenIds = await platformNFT.methods.getTokenIds().call()
      _tokenIds = _tokenIds.toString()
      console.log("_tokenIds", _tokenIds.toString())
      // let _mintAIFee = await nftPlatform.methods.getMintAIFee().call()
      // setMintAIFee(_mintAIFee)
      let _mintReward = await nftPlatform.methods.getMintReward().call()
      _mintReward = web3.utils.fromWei(_mintReward)
      setMintReward(_mintReward)
      let _owner = await nftPlatform.methods.getOwner().call()
      setOwner(_owner)

      let _allListedItems = []
      for (let i=0; i<allItems.length; i++) {
        if (allItems[i].tokenUri != "") {
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
            metadata: allItems[i].tokenUri,
          }
          _allListedItems = [..._allListedItems, item]
        }
      }
      setAllListedItems(_allListedItems)
    }
  }

  const displayModal = async (_price, _image, _tokenUri, _attributes, _name, _description, _itemId, _isMinted, _metadata) => {
    setShowModal(true)
    setImage(_image)
    _price = web3.utils.fromWei(_price)
    setPrice(_price)
    setAttributes(_attributes)
    setName(_name)
    setDesription(_description)
    setItemId(_itemId)
    setIsMinted(_isMinted)
    setMetadata(_metadata)
  }

  const mintNFT = async (_itemId, _price) => {
    setShowModal(false)
    setShowModals(true)
    console.log("itemId", _itemId)
    console.log("price", _price.toString())
    _price = web3.utils.toWei(_price)
    try {
      let newTokenId = await nftPlatform.methods.platformMint(_itemId).send({ from: address, value: _price.toString() })
      console.log("newTokenId", newTokenId)
      loadContractData()
      loadTokenData()
      setShowModals(false)
    } catch (error) {
      setShowModals(false)
    }
  }

  const mintNFTwithRoyalty = async (_itemId, _price) => {
    setShowModal(false)
    setShowModals(true)
    console.log("itemId", _itemId)
    console.log("price", _price.toString())
    _price = web3.utils.toWei(_price)
    try {
      // let _fee = web3.utils.toWei("1")
      let newTokenId = await nftPlatform.methods.mintWithRoyalty(_itemId, 300).send({ from: address, value: _price })
      loadContractData()
      loadTokenData()
      setShowModals(false)
    } catch (error) {
      setShowModals(false)
    }
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
            {/* <a class="navbar-item" href="/"> */}
              <img class="navbar-item" src="./dbank.png" width="100" height="25" />
            {/* </a> */}

            <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </a>
          </div>
           
          <div id="navbarBasicExample" class="navbar-menu">
            <div class="navbar-start">
            {
              address
                ?
                  <>
              <Link legacyBehavior href="/">
                <a class="navbar-item">
                  <strong>Home</strong>
                </a>
              </Link>
              <Link legacyBehavior href="/?page=yourNFT">
                <a class="navbar-item">
                  <strong>My NFTs</strong>
                </a>
              </Link>
              <Link legacyBehavior href="/?page=stakedNFT">
                <a class="navbar-item">
                  <strong>My Staked NFTs</strong>
                </a>
              </Link>
              {/* <Link legacyBehavior href="/?page=aiNFT">
                <a class="navbar-item">
                  <strong>A.I. NFT</strong>
                </a>
              </Link> */}
              <Link legacyBehavior href="/?page=rentable">
                <a class="navbar-item">
                  <strong>Rentable NFTs</strong>
                </a>
              </Link>
              <Link legacyBehavior href="/?page=marketplace">
                <a class="navbar-item">
                  <strong>Marketplace</strong>
                </a>
              </Link>
               
                  </>
                : <></>
            }

            </div>

            <div class="navbar-end">
              <div class="navbar-item">
                  <strong>{dbtSymbol} Balance: {dbtBalance} DBT</strong>
              </div>
              <div class="navbar-item">
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
        {
          page=='yourNFT'
            ?
              <YourNFTs
                nftPlatform={nftPlatform}
                platformNFT={platformNFT}
                nftPlatformAddress={nftPlatformAddress}
                address={address}
                rewardsPerSecond={rewardsPerSecond}
                web3={web3}
                dbtContract={dbtContract}
                owner={owner}
              />
            :
              page=='aiNFT'
                ?
                  <AINFT
                    nftPlatform={nftPlatform}
                    mintAIFee={mintAIFee}
                    web3={web3}
                    address={address}
                    nftPlatformAddress={nftPlatformAddress}
                    platformNFT={platformNFT}
                  />
                :
                  page=='stakedNFT'
                    ?
                      <STAKEDNFT
                        nftPlatform={nftPlatform}
                        platformNFT={platformNFT}
                        web3={web3}
                        address={address}
                     />
                    :
                      page=='rentable'
                        ?
                          <RENTABLE
                            rentable={rentable}
                            address={address}
                            nftPlatform={nftPlatform}
                            web3={web3}
                          />
                        :
                          page=='marketplace'
                            ?
                              <MARKETPLACE
                                address={address}
                                web3={web3}
                                nftPlatform={nftPlatform}
                                platformNFT={platformNFT}
                                owner={owner}
                                nftPlatformAddress={nftPlatformAddress}
                              />
                            :
            <section class="section is-small">
              <div class="container is-max-desktop">
                <h1 class="title">
                  <strong>The Ultimate NFT Platform with Web3 Technologies</strong>
                </h1>
                <h1>
                  So many interesting NFTs are available for you to mint. You get <b>{mintReward} DBT reward</b> for each NFT you minted.<br></br>
                  If you rent a NFT in our <b>Rentable NFTs</b>, you get double DBT reward !!
                </h1>
                
              </div>
              <div class="container is-max-desktop">
                <hr></hr>
              </div>
              <div class="container is-max-desktop">
                { allListedItems.map((columns, j) => {
                  if ((j % 4) == 0) {
                    return (
                      <div class="columns" key={j}>
                        { allListedItems.map((item, i) => {
                          if (i >= j && i < j + 4) {
                            return (
                              <div class="column is-one-quarter" key={i}>
                                <img src={item.image} alt="Placeholder image" width={170}
                                  onClick={() => displayModal(item.nftPrice, item.image, item.tokenUri, item.attributes, item.name, item.description, item.itemId, item.isMinted, item.metadata)}
                                />
                                <p>
                                  { item.isMinted
                                      ? <h1>Already Minted</h1>
                                      : <h1>Price: {web3.utils.fromWei(item.nftPrice)} ETH</h1>
                                  }
                                </p>
                                <Modal show={showModal} onClose={() => setShowModal(false)}>
                                  <div class="columns">
                                    <div class="column is-one-third">
                                      <img src={image} alt="Placeholder image" width={250}/>
                                    </div>
                                    <div class="column">
                                      <h2><strong>Name:</strong> {name}</h2>
                                      <h2><strong>Description:</strong> {description}</h2>
                                      <h2><strong>Price:</strong> {price} ETH</h2>

                                      {
                                        attributes.map((attribute, k) => {
                                          return (
                                            <h2 key={k}><strong>{attribute.trait_type}:</strong> {attribute.value}</h2>
                                          )
                                        })
                                      }
                                      <br></br>
                                      { isMinted
                                          ? <button class="button is-primary is-small is-rounded" onClick={() => mintNFT(itemId, price)} disabled>Mint NFT</button>
                                          : <button class="button is-primary is-small is-rounded" onClick={() => mintNFT(itemId, price)}>Mint NFT</button>
                                      } &nbsp;&nbsp;
                                      {
                                        isMinted
                                          ? <button class="button is-primary is-small is-rounded" onClick={() => mintNFTwithRoyalty(itemId, price)} disabled>Mint NFT with Royalty</button>
                                          : <button class="button is-primary is-small is-rounded" onClick={() => mintNFTwithRoyalty(itemId, price)}>Mint NFT with Royalty</button>
                                      } &nbsp;&nbsp;
                                      <a class="button is-link is-small is-rounded" href={`${metadata}`} target="_blank" rel="noreferrer">Metadata</a>
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
                        })}
                      </div>  
                    )
                  }
                })}
              </div>
            </section> 
        }

      </main>
    </div>
  )
}
