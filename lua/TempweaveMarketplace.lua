-- Tempweave Marketplace

Handle("Accept", function(msg)
    local Candidate = json.parse(msg.Candidate)
    local Hash = hash(msg.Candidate)
        
    assert(Candidate.Namespace == "AO-PC-1-Send",
            "Incorrect message namespace")
    assert(State.Open,
            "Channel is not open")
    assert(ecrecover(Hash, msg.Signature) == State.Creator,
            "Invalid signature")
    assert(Candidate.Target == ao.id,
            "Incorrect target")
    assert(Candidate.Quantity > State.Transferred,
            "Quantity must be higher than already transferred sum")
    assert(Candidate.Quantity > 0,
            "Negative or zero quantity is not allowed")
    assert(Candidate.Quantity <= State.Balance,
            "Trying to spend more than the existing Balance")

    State.Transferred = Candidate.Quantity
end)

function Handle(type, fn)
    Handlers.add(
        type,
        Handlers.utils.hasMatchingTag("Action", type),
        fn
    )
end