# NFT Auction System

This project implements an NFT Auction System for artists to mint and auction their digital artworks as NFTs (Non-Fungible Tokens). The system allows artists to create profiles, mint NFTs, start auctions, and manage bids. The highest bidder wins the auction and the transaction is finalized, transferring ownership of the NFT to the winner.

## Features

- **Artist Profile Management**: Artists can create profiles with their details such as name, wallet address, and email.
- **Artwork Minting**: Artists can mint their artworks and associate them with NFTs.
- **NFT Minting**: Mint NFTs based on the artist’s artwork.
- **Auction Management**: Artists can create and manage auctions for their NFTs.
- **Bidding**: Users can place bids on active auctions.
- **Transaction Management**: Automatically handle transactions and transfer ownership of NFTs after auction finalization.
- **Auction Finalization**: Only the creator of the auction can finalize it once bidding is complete.

## Structs and Data Models

### Artist

Represents an artist in the system.

```json
{
  "id": "string",
  "owner": "Principal",
  "name": "string",
  "walletAddress": "string",
  "email": "string",
  "createdAt": "string"
}
```

### Artwork

Represents an artwork minted by an artist.

```json
{
  "id": "string",
  "artistId": "string",
  "title": "string",
  "description": "string",
  "imageUrl": "string",
  "createdAt": "string"
}
```

### NFT

Represents an NFT in the system.

```json
{
  "id": "string",
  "artworkId": "string",
  "ownerIds": ["string"], 
  "price": 1000000,
  "status": "Pending", 
  "createdAt": "string"
}
```

### Auction

Represents an auction for an NFT.

```json
{
  "id": "string",
  "nftId": "string",
  "highest_bid": 500000,
  "highest_bidder_id": "string",
  "creator": "Principal", 
  "is_active": true,
  "status": "Pending", 
  "createdAt": "string"
}
```

### Transaction

Represents a completed transaction after an auction is finalized.

```json
{
  "id": "string",
  "nftId": "string",
  "buyerId": "string", 
  "sellerId": "string", 
  "price": 500000,
  "createdAt": "string"
}
```

### Message

Response messages for success or failure of operations.

```json
{
  "Success": "string",
  "Error": "string",
  "NotFound": "string",
  "InvalidPayload": "string",
  "Unauthorized": "string",
  "PaymentFailed": "string",
  "PaymentCompleted": "string"
}
```

## API Endpoints

### 1. Create Artist Profile

Creates a profile for an artist.

- **Endpoint**: `createArtistProfile`
- **Method**: `update`
- **Payload**:

```json
{
  "name": "John Doe",
  "walletAddress": "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
  "email": "john@example.com"
}
```

- **Response**:

```json
{
  "Ok": {
    "id": "artist-uuid",
    "owner": "Principal-id",
    "name": "John Doe",
    "walletAddress": "abcd1234...",
    "email": "john@example.com",
    "createdAt": "2024-09-01T12:34:56Z"
  }
}
```

### 2. Mint Artwork

Mints a new artwork associated with an artist.

- **Endpoint**: `mintArtwork`
- **Method**: `update`
- **Payload**:

```json
{
  "artistId": "artist-uuid",
  "title": "Sunset",
  "description": "A beautiful sunset over the ocean.",
  "imageUrl": "https://example.com/sunset.jpg"
}
```

- **Response**:

```json
{
  "Ok": {
    "id": "artwork-uuid",
    "artistId": "artist-uuid",
    "title": "Sunset",
    "description": "A beautiful sunset over the ocean.",
    "imageUrl": "https://example.com/sunset.jpg",
    "createdAt": "2024-09-01T12:45:00Z"
  }
}
```

### 3. Mint NFT

Mints an NFT for an artwork.

- **Endpoint**: `mintNFT`
- **Method**: `update`
- **Payload**:

```json
{
  "artworkId": "artwork-uuid",
  "price": 1000000
}
```

- **Response**:

```json
{
  "Ok": {
    "id": "nft-uuid",
    "artworkId": "artwork-uuid",
    "ownerIds": ["artist-uuid"],
    "price": 1000000,
    "status": "Pending",
    "createdAt": "2024-09-01T13:00:00Z"
  }
}
```

### 4. Create Auction

Creates a new auction for an NFT.

- **Endpoint**: `createAuction`
- **Method**: `update`
- **Payload**:

```json
{
  "nftId": "nft-uuid"
}
```

- **Response**:

```json
{
  "Ok": {
    "id": "auction-uuid",
    "nftId": "nft-uuid",
    "highest_bid": 0,
    "highest_bidder_id": "",
    "creator": "Principal-id",
    "status": "Pending",
    "is_active": true,
    "createdAt": "2024-09-01T14:00:00Z"
  }
}
```

### 5. Place Bid

Places a bid on an auction.

- **Endpoint**: `placeBid`
- **Method**: `update`
- **Payload**:

```json
{
  "auctionId": "auction-uuid",
  "artistId": "artist-uuid",
  "bidAmount": 500000
}
```

- **Response**:

```json
{
  "Ok": {
    "id": "auction-uuid",
    "nftId": "nft-uuid",
    "highest_bid": 500000,
    "highest_bidder_id": "artist-uuid",
    "creator": "Principal-id",
    "status": "Pending",
    "is_active": true,
    "createdAt": "2024-09-01T14:30:00Z"
  }
}
```

### 6. Finalize Auction

Finalizes the auction, transferring the NFT to the highest bidder.

- **Endpoint**: `finalizeAuction`
- **Method**: `update`
- **Payload**:

```json
{
  "auctionId": "auction-uuid"
}
```

- **Response**:

```json
{
  "Ok": {
    "id": "transaction-uuid",
    "nftId": "nft-uuid",
    "buyerId": "artist-uuid",
    "sellerId": "Principal-id",
    "price": 500000,
    "createdAt": "2024-09-01T15:00:00Z"
  }
}
```

### 7. Get Artist Profile

Retrieves the profile of an artist by ID.

- **Endpoint**: `getArtistProfileById`
- **Method**: `query`
- **Payload**:

```json
{
  "artistId": "artist-uuid"
}
```

- **Response**:

```json
{
  "Ok": {
    "id": "artist-uuid",
    "owner": "Principal-id",
    "name": "John Doe",
    "walletAddress": "abcd1234...",
    "email": "john@example.com",
    "createdAt": "2024-09-01T12:34:56Z"
  }
}
```

### 8. Get NFT by ID

Retrieves an NFT by ID.

- **Endpoint**: `getNFTById`
- **Method**: `query`
- **Payload**:

```json
{
  "nftId": "nft-uuid"
}
```

- **Response**:

```json
{
  "Ok": {
    "id": "nft-uuid",
    "artworkId": "artwork-uuid",
    "ownerIds": ["artist-uuid"],
    "price": 1000000,
    "status": "Pending",
    "createdAt": "2024-09-01T13:00:00Z"
  }
}
```

### 9. Get Auction by ID

Retrieves auction details by ID.

- **Endpoint**: `getAuctionById`
- **Method**: `query`
- **Payload**:

```json
{
  "auctionId": "auction-uuid"
}
```

- **Response**:

```json
{
  "Ok": {
    "id": "auction-uuid",
    "nftId": "nft-uuid",
    "highest_bid": 500000,
    "highest_bidder_id": "artist-uuid",
    "creator": "Principal-id",
    "status": "Pending",
    "is_active": true,
    "createdAt": "2024-09-01T14:00:00Z"
  }
}
```

## Sample Usage Flow

1. Create Artist Profile → Mint Artwork → Mint NFT → Create Auction → Place Bid → Finalize Auction → Transfer NFT Ownership.
2. Retrieve Artist Profile, Auction, and Transaction details using their respective query endpoints.

## Things to be explained in the course:

1. What is Ledger? More details here: https://internetcomputer.org/docs/current/developer-docs/integrations/ledger/
2. What is Internet Identity? More details here: https://internetcomputer.org/internet-identity
3. What is Principal, Identity, Address? https://internetcomputer.org/internet-identity | https://yumimarketplace.medium.com/whats-the-difference-between-principal-id-and-account-id-3c908afdc1f9
4. Canister-to-canister communication and how multi-canister development is done? https://medium.com/icp-league/explore-backend-multi-canister-development-on-ic-680064b06320

## How to deploy canisters implemented in the course

### Ledger canister

`./deploy-local-ledger.sh` - deploys a local Ledger canister. IC works differently when run locally so there is no default network token available and you have to deploy it yourself. Remember that it's not a token like ERC-20 in Ethereum, it's a native token for ICP, just deployed separately.
This canister is described in the `dfx.json`:

```
	"ledger_canister": {
  	"type": "custom",
  	"candid": "https://raw.githubusercontent.com/dfinity/ic/928caf66c35627efe407006230beee60ad38f090/rs/rosetta-api/icp_ledger/ledger.did",
  	"wasm": "https://download.dfinity.systems/ic/928caf66c35627efe407006230beee60ad38f090/canisters/ledger-canister.wasm.gz",
  	"remote": {
    	"id": {
      	"ic": "ryjl3-tyaaa-aaaaa-aaaba-cai"
    	}
  	}
	}
```

`remote.id.ic` - that is the principal of the Ledger canister and it will be available by this principal when you work with the ledger.

Also, in the scope of this script, a minter identity is created which can be used for minting tokens
for the testing purposes.
Additionally, the default identity is pre-populated with 1000_000_000_000 e8s which is equal to 10_000 \* 10**8 ICP.
The decimals value for ICP is 10**8.

List identities:
`dfx identity list`

Switch to the minter identity:
`dfx identity use minter`

Transfer ICP:
`dfx ledger transfer <ADDRESS> --memo 0 --icp 100 --fee 0`
where:

- `--memo` is some correlation id that can be set to identify some particular transactions (we use that in the marketplace canister).
- `--icp` is the transfer amount
- `--fee` is the transaction fee. In this case it's 0 because we make this transfer as the minter idenity thus this transaction is of type MINT, not TRANSFER.
- `<ADDRESS>` is the address of the recipient. To get the address from the principal, you can use the helper function from the marketplace canister - `getAddressFromPrincipal(principal: Principal)`, it can be called via the Candid UI.

### Internet identity canister

`dfx deploy internet_identity` - that is the canister that handles the authentication flow. Once it's deployed, the `js-agent` library will be talking to it to register identities. There is UI that acts as a wallet where you can select existing identities
or create a new one.

### Marketplace canister

`dfx deploy dfinity_js_backend` - deploys the marketplace canister where the business logic is implemented.
Basically, it implements functions like add, view, update, delete, and buy products + a set of helper functions.

Do not forget to run `dfx generate dfinity_js_backend` anytime you add/remove functions in the canister or when you change the signatures.
Otherwise, these changes won't be reflected in IDL's and won't work when called using the JS agent.
