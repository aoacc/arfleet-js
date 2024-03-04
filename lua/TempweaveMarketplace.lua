local json = require("json")

State = {
    Announcements = {},
    Prices = {},
}

function Log(msg)
    print(msg)
end

-- The Handle function must be defined before we use it
function Handle(type, fn)
    Handlers.add(
        type,
        Handlers.utils.hasMatchingTag("Action", type),
        function(msg)
            local Data = json.decode(msg.Data)
            local Result = fn(msg, Data)
            if Result == nil then
                return
            end
            Handlers.utils.reply(Result)(msg)
        end
    )
end

Handle("Announce", function(msg, Data)
    local From = msg.From

    local ConnectionStrings = Data["Connection-Strings"]
    local StorageCapacity = Data["Storage-Capacity"]

    State.Announcements[From] = {
        ConnectionStrings = ConnectionStrings,
        StorageCapacity = StorageCapacity
    }
end)

Handle("Update-Price", function(msg)
    local From = msg.From
    
    local Token = Data["Token"]
    local Price = Data["Price"]

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

Handle("Get-Announcements", function(msg)
    return json.encode(State.Announcements)
end)

Handle("Get-Announcement", function(msg, Data)
    local Provider = Data["Provider"]
    return json.encode(State.Announcements[Provider])
end)

Handle("Get-Prices", function(msg)
    return json.encode(State.Prices)
end)

Handle("Disconnect-Ownership", function(msg)
    Owner = ""
end)

Handle("Get-Owner", function(msg)
    return Owner
end)

