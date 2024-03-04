State = {
    Announcements = {},
    Prices = {},
}

-- The Handle function must be defined before we use it
function Handle(type, fn)
    Handlers.add(
        type,
        Handlers.utils.hasMatchingTag("Action", type),
        fn
    )
end

Handle("DisconnectOwnership", function(msg)
    Owner = ""
end)

Handle("GetOwner", function(msg)
    return Owner
end)

Handle("Announce", function(msg)
    local From = msg.From

    local ConnectionStrings = msg.Data.ConnectionStrings
    local StorageCapacity = msg.Data.StorageCapacity

    State.Announcements[From] = {
        ConnectionStrings = ConnectionStrings,
        StorageCapacity = StorageCapacity
    }
end)

Handle("UpdatePrice", function(msg)
    local From = msg.From
    
    local Token = msg.Data.Token
    local Price = msg.Data.Price

    -- Go through the list of announcements and update the price 
    -- or create a new entry if it doesn't exist
    -- Pair From, Token should be unique
    for k, v in pairs(State.Announcements) do
        if k == From then
            -- If State.Prices[From] doesn't exist, create it
            if State.Prices[From] == nil then
                State.Prices[From] = {}
            end

            -- If the From.Token doesn't exist, create it with the provided price
            if State.Prices[From][Token] == nil then
                State.Prices[From][Token] = {}
            end

            State.Prices[From][Token] = Price
        end
    end
end)