[] announcements - how will clients find providers, and how can they become ones behind nat? and what if i want to test on localhost [] turn/proxy server? at least for now?
    [] how to give people tokens to test

[] signature + encrypt

[] retrieval discovery. dht?
[] proper frontend

- [] retrieval

[] instead of 5 seconds, trigger changes immediately. and 5 seconds could now be extended [] accelerate instead of 5 s (and chunks too)
[] accelerate in general
[] rsa in separate processes [] multithreaded encryption

[] UI
[] private vs public vs unlisted files

[] will fail on another `store` because assignment already exists, fix this.

[] pricing and deal duration

[] delete storage we don't have to keep anymore (slashed or expired) [] provider: delete chunks that we don't have to keep because the deal never finalized
[] warnings for the provider in ui when the next challenge is, so they stay online during that time

[] allow to flip the switch and not accept any more deals

[] from time to time check deals, and if something is wrong, recover the data and send to another provider
[] advanced: allow to transfer the storage deal to another provider (from the provider itself)

- [] better errors from api

[] clean the connection string from extra stuff and only leave host and port and known protocol - for security
[] if some provider has been dead for a long while, don't contact them, even with other placements
[] if the deal doesn't move for some time, fail it. same from provider side!


[] what happens if a file is uploaded with one of the prologues? security check

[] maintain peers addr book


what will we have to keep after the container is stored?

1. providers (storage link counterparty)
2. (key we don't have to store, derivable)
3. encrypted tree root of the container - that's the container id
4. the root directory index id. if it's in several chunks, it will give us many pointers into the same container tree

Moving parts
- Core
    - Config
    - Utils
    - Datadir for client/provider
    - Cli tool
    - Arweave wallet
    - Sqlite3 database / sequelize ORM / automigrations
    - Connect to Arweave and ao
    - RSA encrypt/decrypt
    - RSA sign/verify
    - AES256 encrypt/decrypt
    - Signing/verifying requests/responses between parties
- Lua Modules
    - ArFleetMarketplace.lua
    - ArFleetDeal.lua
    - libraries: sha256, base64, hex
- Client
    - Local API
    - Store files/directories
        - Assignment
            - Chunkify
            - Merklize
            - Build file index
            - Build directory index
            - Reach out to Marketplace to get announcements
            - Auto create placements when redundancy < desired
        - Placement
            - Find provider
            - Negotiate
            - Encrypt with RSA
            - Merklize replica
            - Spawn the deal process
            - Fund the deal
            - Transfer
            - Finalize
    - Retrieve files
    - Background queues
    - Continue after restart (queue boot)
- Provider
    - Local API
    - Public API (for clients to reach out to)
        - ... same functionality as client but from the other side ...
    - REPL
        - "announce" / "announce [IP:port]"