[x] config
[x] establish datadir; use ~/.tempweave. bring homedir
[x] create arweave wallet on the fly

[x] db
[] files, chunks, storage_links
[] add file: ./tempweave store . <--- path
    it gets copied to ~/.tempweave/jobs
    success state
    it gets chunked
    we find storage links meanwhile, negotiate prices
    encrypt
    the whole thing happens where the deals are created and exchanged

[] create simple bootstrap/react UI
[] maintain peers addr book
[] chunkify

[] will fail on another `store` because assignment already exists, fix this.


tables:
files

chunks

gonna bring sqlite? and then mess with orms? or just files as db...

ok let's see, what is going to be the plan?

desired_redundancy = 3


- [] better errors from api


StorageContainer {
    ... files here
}

what will we have to keep after the container is stored?

1. providers (storage link counterparty)
2. (key we don't have to store, derivable)
3. encrypted tree root of the container - that's the container id
4. the root directory index id. if it's in several chunks, it will give us many pointers into the same container tree