import { useState, useEffect } from 'react'
import Modal from './Modal'
import ModalS from './ModalS'

export default function rentableNFT({ rentable, address, nftPlatform, web3 }) {

    const [showModal, setShowModal] = useState(false)
    const [showModals, setShowModals] = useState(false)
    const [rentableImage, setRentableImage] = useState()
    const [rentableName, setRetableName] = useState()
    const [rentableDescription, setRentableDescription] = useState()
    const [pricePerDay, setPricePerDay] = useState("0")
    const [endDateHumanFormat, setEndDateHumanFormat] = useState()
    const [endDateUNIX, setEndDateUNIX] = useState()
    const [startDateUNIX, setStartDateUNIX] = useState()
    const [rentableTokenId, setRentableTokenId] = useState()
    const [rentableItems, setRentableItems] = useState([])
    const [numOfDays, setNumOfDays] = useState()
    const [nftExpires, setNFTExpires] = useState()
    const [nftUser, setNFTUser] = useState()
    const [expiresHumanFormat, setExpiresHumanFormat] = useState()
    const [availableToRent, setAvailableToRent] = useState()

    useEffect(() => {
        if (address) {
          loadRentableContractData()
        }
    }, [address, nftPlatform])
    
    const displayModal = async (_rentableImage, _name, _tokenId, _description, _pricePerDay, _startDateUNIX, _endDateUNIX) => {
        setRentableImage(_rentableImage)
        setRetableName(_name)
        setRentableDescription(_description)
        setRentableTokenId(_tokenId)
        setPricePerDay(_pricePerDay.toString())

        let expires = await rentable.methods.userExpires(_tokenId).call()
        let user = await rentable.methods.userOf(_tokenId).call()
        setShowModal(true)
        console.log("_expires", expires)
        console.log("user", user)
        setNFTExpires(expires)
        setNFTUser(user)
        let _expiresHumanFormat = expires
        _expiresHumanFormat = new Date(_expiresHumanFormat * 1000)
        setExpiresHumanFormat(_expiresHumanFormat.toLocaleString())

        setEndDateUNIX(_endDateUNIX)
        setStartDateUNIX(_startDateUNIX)
        _endDateUNIX = new Date(_endDateUNIX * 1000)
        setEndDateHumanFormat(_endDateUNIX.toLocaleString())
        console.log("endDateUNIX", endDateUNIX)
        console.log("startDateUNIX", _startDateUNIX)
        _startDateUNIX = new Date(_startDateUNIX * 1000)
        console.log("start date", _startDateUNIX.toLocaleString())
        console.log("now", Math.ceil(Date.now() / 1000))
    }

    const daysToRent = event => {
        console.log("QTY: ", event.target.value)
        setNumOfDays(event.target.value)
    }

    const rent = async (_tokenId, _pricePerDay) => {
        console.log("numOfDays", parseInt(numOfDays))
        console.log("tokenId", _tokenId)
        if (parseInt(numOfDays) < 1) {
            alert(
                `Must be integer and greater than 1`,
            );
        } else {
            setShowModal(false)
            setShowModals(true)
            const now = Math.ceil(Date.now() / 1000)
            const expires = now + parseInt(numOfDays) * 60 * 60 * 24
            const numDays = parseInt((expires - now) / 60 / 60 / 24)
            const fee = Math.ceil(numDays * _pricePerDay)

            if (expires <= endDateUNIX) {
                console.log("expires", expires)
                console.log("numDays", numDays)
                console.log("rentFee", fee)
                console.log("enddateUNIX", endDateUNIX)
                console.log("price per day", _pricePerDay)
                try {
                    await nftPlatform.methods.rentToPlatform(_tokenId, expires, numDays).send({ from: address, value: fee.toString() })
                    loadRentableContractData()
                    setShowModals(false)
                } catch (error) {
                    loadRentableContractData()
                    setShowModals(false)
                }
                
            } else {
                alert(
                    `Rental period exceeds max date rentable - ${endDateHumanFormat}`,
                );
                loadRentableContractData()
                setShowModals(false)
            }
        }
        
    }
  
    const loadRentableContractData = async () => {
        if (rentable) {
          let _availableToRent = 0
          let allItems = await nftPlatform.methods.getAllRentingItem().call()
          let _allRentableItems = []
          console.log("all items", allItems.length)

          let _user, _expires, avail
          for (let i=0; i<allItems.length; i++) {
            console.log("tokenId", i+1)
            console.log("price per day", allItems[i].pricePerDay)
            console.log("startDateUNIX", allItems[i].startDateUNIX)
            console.log("endDateUNIX", allItems[i].endDateUNIX)
            _user = await rentable.methods.userOf(i+1).call()
            console.log("user", _user)
            _expires = await rentable.methods.userExpires(i+1).call()
            console.log("expires", _expires)
            console.log("now",Math.floor(Date.now()/1000))
            // !nftUser == null || Math.ceil(Date.now() / 1000) < nftExpires || startDateUNIX > Math.ceil(Date.now() / 1000)
            if (!_user == null || _expires > Math.floor(Date.now()/1000)) {
               avail = "Not Available"
            } else {
               avail = "Available"
               _availableToRent = _availableToRent + 1
            }
            if (allItems[i].pricePerDay > 0) {
                let rentableTokenUri = await rentable.methods.tokenURI(i+1).call()
                rentableTokenUri = rentableTokenUri.replace("ipfs://", "https://nftstorage.link/ipfs/")
                let metadata = await fetch(rentableTokenUri).then((response) => response.json())
                const item = {
                  tokenId: i+1,
                  pricePerDay: allItems[i].pricePerDay,
                  startDateUNIX: allItems[i].startDateUNIX,
                  endDateUNIX: allItems[i].endDateUNIX,
                  image: metadata["image"],
                  name: metadata["name"],
                  description: metadata["description"],
                  available: avail,
                }
                _allRentableItems = [..._allRentableItems, item]
            }
          }
          console.log("available to rent", _availableToRent)
          setAvailableToRent(_availableToRent)
          setRentableItems(_allRentableItems)
        }
    }
    
    return (
        <section class="section is-small">
            <div class="container is-max-desktop">
                <h1 class="title">
                  <strong>The Ultimate NFT Platform with Web3 Technologies</strong><br></br><br></br>
                </h1>
                <h1 class="subtitle"><strong>Rentable NFTs</strong></h1> - Pay to use NFT, available to rent: {availableToRent}<br></br>
                   
            </div>
            <div class="container is-max-desktop">
                <p><hr></hr></p>
            </div>
            <div class="container is-max-desktop">
                {
                    rentableItems.map((columns, j) => {
                        if ((j % 4) == 0) {
                            return (
                                <div class="columns" key={j}>
                                    {rentableItems.map((item, i) => {
                                        if (i >= j && i < j + 4) {
                                            let _rentableImage = item.image
                                            _rentableImage = _rentableImage.replace("ipfs://", "https://nftstorage.link/ipfs/")
                                            return (
                                                <div class="column is-one-quarter" key={i}>
                                                    <img src={_rentableImage} alt="Placeholder image" width={170} 
                                                        onClick={() => displayModal(_rentableImage, item.name, item.tokenId, item.description, item.pricePerDay, item.startDateUNIX, item.endDateUNIX, item.expires, item.user)}
                                                    /><br></br>{item.available}
                                                    <Modal show={showModal} onClose={() => setShowModal(false)}>
                                                        <div class="columns">
                                                            <div class="column is-one-third">
                                                                <img src={rentableImage} className="img-fluid rounded-start" alt="..." width={200} height={200}/><br></br>
                                                            </div>
                                                            <div class="column">
                                                                <strong>Name: </strong>{rentableName}<br></br>
                                                                <strong>Description: </strong>{rentableDescription}<br></br>
                                                                <strong>Token ID: </strong>{rentableTokenId}<br></br>
                                                                <strong>Price per Day: </strong>{web3.utils.fromWei(pricePerDay)} ETH<br></br>
                                                                
                                                                { !nftUser == null || Math.ceil(Date.now() / 1000) < nftExpires || startDateUNIX > Math.ceil(Date.now() / 1000)
                                                                    ? 
                                                                        nftExpires > Math.ceil(Date.now() / 1000)
                                                                            ? <><strong>Rental expires : </strong>{expiresHumanFormat}<br></br>
                                                                                <strong>User : </strong>{nftUser}
                                                                              </>
                                                                            : <></>
                                                                    
                                                                    : 
                                                                    <>
                                                                    <div class="columns">
                                                                        <div class="column is-one-third mt-2">
                                                                            <strong>Day(s) to Rent: </strong>
                                                                        </div>
                                                                        <div class="column ml-0 mt-2">
                                                                            <input class="input is-small is-rounded" type="text" onChange={daysToRent} placeholder='Must be >=1, only count the integer part' />
                                                                        </div>
                                                                    </div>
                                                                    <button class="button is-primary is-small is-rounded " onClick={() => rent(rentableTokenId, pricePerDay)}>Rent</button>
                                                                    </>
                                                                }
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
                    })
                }
            </div>
        </section>
    )
}