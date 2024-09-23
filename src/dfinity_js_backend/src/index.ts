import { verify } from "@dfinity/agent";
import { auto } from "@popperjs/core";
import {
  query,
  update,
  text,
  Null,
  Record,
  StableBTreeMap,
  Variant,
  Vec,
  None,
  Some,
  Ok,
  Err,
  ic,
  Principal,
  Opt,
  nat64,
  Duration,
  Result,
  bool,
  Canister,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Artist Profile Struct
const Artist = Record({
  id: text,
  owner: Principal,
  name: text,
  walletAddress: text,
  email: text,
  createdAt: text,
});

// Artwork Struct
const Artwork = Record({
  id: text,
  artistId: text,
  title: text,
  description: text,
  imageUrl: text,
  createdAt: text,
});

// NFT Struct
const NFT = Record({
  id: text,
  artworkId: text,
  ownerIds: Vec(text), // Multiple owners for fractional ownership
  price: nat64,
  status: text, // Pending, Completed, Cancelled
  createdAt: text,
});

// Auction Struct
const Auction = Record({
  id: text,
  nftId: text,
  highest_bid: nat64,
  highest_bidder_id: text,
  creator: Principal,
  is_active: bool,
  status: text, // Pending, Completed, Cancelled
  createdAt: text,
});

// Transaction Struct
const Transaction = Record({
  id: text,
  nftId: text,
  buyerId: text,
  sellerId: text,
  price: nat64,
  createdAt: text,
});

// Message Struct
const Message = Variant({
  Success: text,
  Error: text,
  NotFound: text,
  InvalidPayload: text,
  Unauthorized: text,
  PaymentFailed: text,
  PaymentCompleted: text,
});

// Payloads
const ArtistPayload = Record({
  name: text,
  walletAddress: text,
  email: text,
});

const ArtworkPayload = Record({
  artistId: text,
  title: text,
  description: text,
  imageUrl: text,
});

const NFTPayload = Record({
  artworkId: text,
  price: nat64,
});

// Auction Payload
const AuctionPayload = Record({
  nftId: text,
});

// Place Bid Payload
const PlaceBidPayload = Record({
  auctionId: text,
  bidAmount: nat64,
});

// Storage
const artistStorage = StableBTreeMap(0, text, Artist);
const artworkStorage = StableBTreeMap(1, text, Artwork);
const nftStorage = StableBTreeMap(2, text, NFT);
const transactionStorage = StableBTreeMap(3, text, Transaction);
const auctionStorage = StableBTreeMap(4, text, Auction);

const TIMEOUT_PERIOD = 9600n;

// Helper Functions

// Function to validate the email format
function validateEmail(email: string): bool {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to validate email address uniqueness
function isEmailUnique(email: string): bool {
  const artistList = artistStorage.values();
  return artistList.every((artist) => artist.email !== email);
}

// Function to validate the ICP wallet address format
function validateWalletAddress(walletAddress: string): boolean {
  // Regex for ICP wallet address (64-character hexadecimal string)
  const walletAddressRegex = /^[a-fA-F0-9]{64}$/;
  return walletAddressRegex.test(walletAddress);
}

// Function to check if artist exists
function getArtistById(artistId: string) {
  return artistStorage.values().find((artist) => artist.id === artistId);
}

// Function to check if artwork exists
function getArtworkById(artworkId: string) {
  return artworkStorage.get(artworkId);
}

// Function to check if NFT exists
function getNFTById(nftId: string) {
  return nftStorage.get(nftId);
}

// Function to check if auction exists
function getAuctionById(auctionId: string) {
  return auctionStorage.get(auctionId);
}

// Functions

export default Canister({
  createArtistProfile: update(
    [ArtistPayload],
    Result(Artist, Message),
    (payload) => {
      // Ensure all the required fields are provided
      if (!payload.name || !payload.email || !payload.walletAddress) {
        return Err({ InvalidPayload: "Missing required fields" });
      }

      // Validate the email address
      if (!validateEmail(payload.email)) {
        return Err({ InvalidPayload: "Invalid email address" });
      }

      // Check if the email address is unique
      if (!isEmailUnique(payload.email)) {
        return Err({ InvalidPayload: "Email address already exists" });
      }

      // Validate the ICP wallet address
      if (!validateWalletAddress(payload.walletAddress)) {
        return Err({ InvalidPayload: "Invalid ICP wallet address" });
      }

      const artistId = uuidv4();
      const artist = {
        id: artistId,
        owner: ic.caller(),
        ...payload,
        createdAt: new Date().toISOString(),
      };

      artistStorage.insert(artistId, artist);
      return Ok(artist);
    }
  ),

  // Function to create artwork
  mintArtwork: update([ArtworkPayload], Result(Artwork, Message), (payload) => {
    // Ensure all the required fields are provided
    if (!payload.title || !payload.imageUrl || !payload.description) {
      return Err({ InvalidPayload: "All fields are required" });
    }

    // Check if the artist exists
    const artistOpt = getArtistById(payload.artistId);

    if (!artistOpt) {
      return Err({ InvalidPayload: "Artist not found" });
    }

    // Create the artwork
    const artworkId = uuidv4();
    const artwork = {
      id: artworkId,
      artistId: payload.artistId,
      title: payload.title,
      description: payload.description,
      imageUrl: payload.imageUrl,
      createdAt: new Date().toISOString(),
    };

    // Insert the artwork into the storage
    artworkStorage.insert(artworkId, artwork);

    // Return the artwork
    return Ok(artwork);
  }),

  // Function to mint NFT
  mintNFT: update([NFTPayload], Result(NFT, Message), (payload) => {
    // Ensure all the required fields are provided
    if (!payload.artworkId || !payload.price) {
      return Err({ InvalidPayload: "All fields are required" });
    }

    // Check if the artwork exists
    const artworkOpt = getArtworkById(payload.artworkId);

    if ("None" in artworkOpt) {
      return Err({ InvalidPayload: "Artwork not found" });
    }

    // Check if the artist exists/owns the artwork
    const artistOpt = getArtistById(artworkOpt.Some.artistId);

    if (!artistOpt) {
      return Err({ InvalidPayload: "Artist not found" });
    }

    // Create the NFT
    const nftId = uuidv4();
    const nft = {
      id: nftId,
      artworkId: payload.artworkId,
      ownerIds: [artistOpt.id], // Set the artist as the initial owner`
      price: payload.price,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    nftStorage.insert(nftId, nft);
    return Ok(nft);
  }),

  // Function to create auction
  createAuction: update(
    [AuctionPayload],
    Result(Auction, Message),
    (payload) => {
      // Ensure all the required fields are provided
      if (!payload.nftId) {
        return Err({ InvalidPayload: "All fields are required" });
      }

      // Check if the NFT exists
      const nftOpt = getNFTById(payload.nftId);

      if ("None" in nftOpt) {
        return Err({ InvalidPayload: "NFT not found" });
      }

      // Check if the NFT is available for sale
      if (nftOpt.Some.status !== "Pending") {
        return Err({ InvalidPayload: "NFT is not available for sale" });
      }

      // Create the auction
      const auctionId = uuidv4();
      const auction = {
        id: auctionId,
        nftId: payload.nftId,
        highest_bid: 0n,
        highest_bidder_id: "",
        creator: ic.caller(),
        status: "Pending",
        is_active: true,
        createdAt: new Date().toISOString(),
      };

      auctionStorage.insert(auctionId, auction);
      return Ok(auction);
    }
  ),

  // Function to place bid
  placeBid: update(
    [text, text, nat64],
    Result(Auction, Message),
    (auctionId, artistId, bidAmount) => {
      // check if the artist exists
      const artistOpt = getArtistById(artistId);

      if (!artistOpt) {
        return Err({ InvalidPayload: "Artist not found" });
      }

      // Check if the auction exists
      const auctionOpt = getAuctionById(auctionId);

      if ("None" in auctionOpt) {
        return Err({ InvalidPayload: "Auction not found" });
      }

      // Check if the auction is still pending
      if (auctionOpt.Some.status !== "Pending") {
        return Err({ InvalidPayload: "Auction is not available" });
      }

      // Check if the bid amount is higher than the current highest bid
      if (bidAmount <= auctionOpt.Some.highest_bid) {
        return Err({
          InvalidPayload:
            "Bid amount must be higher than the current highest bid",
        });
      }

      // Check if the provided artistId exists in the artistStorage
      const bidderOpt = getArtistById(artistId);
      if (!bidderOpt) {
        return Err({ InvalidPayload: "Bidder does not exist" });
      }

      // Proceed with placing the bid
      const updatedAuction = {
        ...auctionOpt.Some,
        highest_bid: bidAmount,
        highest_bidder_id: artistId, // Store the artistId as highest_bidder_id
      };

      // Update the auction storage with the new bid
      auctionStorage.insert(auctionId, updatedAuction);

      return Ok(updatedAuction);
    }
  ),

  // Function to finalize auction
  finalizeAuction: update([text], Result(Transaction, Message), (auctionId) => {
    // Check if the auction exists
    const auctionOpt = getAuctionById(auctionId);

    if ("None" in auctionOpt) {
      return Err({ InvalidPayload: "Auction not found" });
    }

    // Check if the auction is still pending
    if (auctionOpt.Some.status !== "Pending") {
      return Err({ InvalidPayload: "Auction is not available" });
    }

    // Check if the caller is the creator of the auction
    if (ic.caller().toText() !== auctionOpt.Some.creator.toText()) {
      return Err({ Unauthorized: "Only the creator can finalize the auction" });
    }

    // Check if there are any bids
    if (auctionOpt.Some.highest_bid === 0n) {
      return Err({ InvalidPayload: "No bids found" });
    }

    // Check if the auction is still active
    if (!auctionOpt.Some.is_active) {
      return Err({ InvalidPayload: "Auction has already been finalized" });
    }

    // Get the NFT details
    const nftOpt = getNFTById(auctionOpt.Some.nftId);

    if ("None" in nftOpt) {
      return Err({ InvalidPayload: "NFT not found" });
    }

    // Get the highest bidder details (artist)
    const bidderOpt = getArtistById(auctionOpt.Some.highest_bidder_id);

    if (!bidderOpt) {
      return Err({ InvalidPayload: "Bidder not found" });
    }

    // Proceed to finalize the auction by transferring the NFT and creating a transaction

    // Update the NFT owner to the highest bidder
    const updatedNFT = {
      ...nftOpt.Some,
      ownerIds: [auctionOpt.Some.highest_bidder_id], // Transfer ownership to the highest bidder
      status: "Completed",
    };

    nftStorage.insert(auctionOpt.Some.nftId, updatedNFT);

    // Create the transaction record
    const transactionId = uuidv4();
    const transaction = {
      id: transactionId,
      nftId: auctionOpt.Some.nftId,
      buyerId: auctionOpt.Some.highest_bidder_id, // Set the highest bidder as the buyer
      sellerId: auctionOpt.Some.creator.toText(), // Set the auction creator as the seller
      price: auctionOpt.Some.highest_bid, // The final bid amount
      createdAt: new Date().toISOString(), // Timestamp of the transaction
    };

    transactionStorage.insert(transactionId, transaction);

    // Mark the auction as completed and inactive
    const updatedAuction = {
      ...auctionOpt.Some,
      status: "Completed",
      is_active: false,
    };

    auctionStorage.insert(auctionId, updatedAuction);

    return Ok(transaction); // Return the successful transaction details
  }),

  // Function to get artist profile by ID
  getArtistProfileById: query([text], Result(Artist, Message), (artistId) => {
    const artistOpt = artistStorage.get(artistId);

    if ("None" in artistOpt) {
      return Err({ NotFound: "Artist not found" });
    }

    return Ok(artistOpt.Some);
  }),

  // Function to get artwork by ID
  getArtworkById: query([text], Result(Artwork, Message), (artworkId) => {
    const artworkOpt = artworkStorage.get(artworkId);

    if ("None" in artworkOpt) {
      return Err({ NotFound: "Artwork not found" });
    }

    return Ok(artworkOpt.Some);
  }),

  // Function to get NFT by ID
  getNFTById: query([text], Result(NFT, Message), (nftId) => {
    const nftOpt = nftStorage.get(nftId);

    if ("None" in nftOpt) {
      return Err({ NotFound: "NFT not found" });
    }

    return Ok(nftOpt.Some);
  }),

  // Function to get Auction Details by ID
  getAuctionById: query([text], Result(Auction, Message), (auctionId) => {
    const auctionOpt = auctionStorage.get(auctionId);

    if ("None" in auctionOpt) {
      return Err({ NotFound: "Auction not found" });
    }

    return Ok(auctionOpt.Some);
  }),

  // Function to get Active Auctions
  getActiveAuctions: query([], Result(Vec(Auction), Message), () => {
    const activeAuctions = auctionStorage
      .values()
      .filter((auction) => auction.is_active);

    if (activeAuctions.length === 0) {
      return Err({ NotFound: "No active auctions found" });
    }

    return Ok(activeAuctions);
  }),

  // Function to get completed auctions
  getCompletedAuctions: query([], Result(Vec(Auction), Message), () => {
    const completedAuctions = auctionStorage
      .values()
      .filter((auction) => auction.status === "Completed");

    if (completedAuctions.length === 0) {
      return Err({ NotFound: "No completed auctions found" });
    }

    return Ok(completedAuctions);
  }),

  // Function to get Artist's NFTs for auction
  getArtistNFTsForAuction: query(
    [text],
    Result(Vec(NFT), Message),
    (artistId) => {
      const nfts = nftStorage
        .values()
        .filter((nft) => nft.ownerIds.includes(artistId));

      if (nfts.length === 0) {
        return Err({ NotFound: "No NFTs found" });
      }

      return Ok(nfts);
    }
  ),

  // Cancel Auction
  cancelAuction: update([text], Result(Auction, Message), (auctionId) => {
    // Check if the auction exists
    const auctionOpt = auctionStorage.get(auctionId);

    if ("None" in auctionOpt) {
      return Err({ InvalidPayload: "Auction not found" });
    }

    // Check if the auction is still pending
    if (auctionOpt.Some.status !== "Pending") {
      return Err({ InvalidPayload: "Auction is not available" });
    }

    // Check if the caller is the creator of the auction
    if (ic.caller().toText() !== auctionOpt.Some.creator.toText()) {
      return Err({
        Unauthorized: " Only the creator can cancel the auction",
      });
    }

    const updatedAuction = {
      ...auctionOpt.Some,
      status: "Cancelled",
    };

    auctionStorage.insert(auctionId, updatedAuction);
    return Ok(updatedAuction);
  }),

  //  Get NFT Auction History
  getNFTAuctionHistory: query(
    [text],
    Result(Vec(Auction), Message),
    (nftId) => {
      const auctions = auctionStorage
        .values()
        .filter((auction) => auction.nftId === nftId);

      if (auctions.length === 0) {
        return Err({ NotFound: "No auction history found" });
      }

      return Ok(auctions);
    }
  ),

  // Function to get transaction by ID
  getTransactionById: query(
    [text],
    Result(Transaction, Message),
    (transactionId) => {
      const transactionOpt = transactionStorage.get(transactionId);

      if ("None" in transactionOpt) {
        return Err({ NotFound: "Transaction not found" });
      }

      return Ok(transactionOpt.Some);
    }
  ),
});