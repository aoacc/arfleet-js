-- Tempweave Deal Blueprint

local json = require("json")

StatusEnum = {Created = "Created", Activated = "Activated", Cancelled = "Cancelled"}

State = {
    Status = StatusEnum.Created,
    MerkleRoot = "",
    Client = "",
    Provider = "",
    CreatedAt = 0,
    ExpiresAt = 0,

    RequiredReward = 0,
    ReceivedReward = 0,

    RequiredCollateral = 0,
    ReceivedCollateral = 0, 
    SlashedCollateral = 0,
    RemainingCollateral = 0,
    SlashedTimes = 0,

    VerificationEveryPeriod = 0,
    VerificationResponsePeriod = 0,
    Token = "",

    LastVerification = 0,

    Logs = {}
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
            -- if starts with { or [, try to decode
            local Data = nil
            
            local success, res = pcall(json.decode, msg.Data)
            if success then
                Data = res
            else
                -- error, leave it nil
            end

            local Result = fn(msg, Data)

            if Result == nil then
                return
            end
            Handlers.utils.reply(Result)(msg)
        end
    )
end

Handle("Credit-Notice", function(msg, Data)
    State.Logs[#State.Logs + 1] = json.encode(msg)

    -- Validate token
    if msg.From ~= State.Token then
        return
    end

    -- Ignore after it was already activated
    if State.Status ~= StatusEnum.Created then
        return
    end

    -- todo: verify Target == ao.id

    if msg.Sender == State.Client then
        State.ReceivedReward = State.ReceivedReward + msg.Quantity
    elseif msg.Sender == State.Provider then
        State.ReceivedCollateral = State.ReceivedCollateral + msg.Quantity

        -- Activate
        
        if State.Status ~= StatusEnum.Created then
            return
        end
    
        if State.ReceivedCollateral < State.RequiredCollateral then
            return
        end
    
        if State.ReceivedReward < State.RequiredReward then
            return
        end
    
        State.Status = StatusEnum.Activated
        State.RemainingCollateral = State.ReceivedCollateral
    
    else
        return
    end
end)

Handle("Cancel", function(msg, Data)
    -- Verify that it's from the Client
    if msg.From ~= State.Client then
        return
    end

    -- Only in inactive state
    if State.Status ~= StatusEnum.Created then
        return
    end

    -- Send the funds back to the client
    if State.ReceivedReward > 0 then
        -- todo
    end

    -- Send the collateral back to the provider
    if State.ReceivedCollateral > 0 then
        -- todo
    end
end)

Handle("Verify", function(msg, Data)
    -- Verify that it's from the Provider
    if msg.From ~= State.Provider then
        return
    end

    -- Only in active state
    if State.Status ~= StatusEnum.Activated then
        return
    end

    -- too late?

    -- too early?

    -- get the string
end)

Handle("GetState", function(msg)
    return json.encode(State)
end)

-- todo: withdraw collateral at the end when expires by provider

-- todo: withdraw rewards + slashed collateral at the end when expires by client