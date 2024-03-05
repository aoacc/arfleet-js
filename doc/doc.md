- [] processes should work
- [] process
    - [] funded
    - [] files sent
    - [] collaterized, switch flipped (assume how much collateral is needed precisely)
- [] verification game
- [] retrieval
- [] instead of 5 seconds, trigger changes immediately. and 5 seconds could now be extended

[] create simple bootstrap/react UI
[] maintain peers addr book
[x] chunkify

[] will fail on another `store` because assignment already exists, fix this.

tables:
files

chunks

- [] better errors from api

what will we have to keep after the container is stored?

1. providers (storage link counterparty)
2. (key we don't have to store, derivable)
3. encrypted tree root of the container - that's the container id
4. the root directory index id. if it's in several chunks, it will give us many pointers into the same container tree