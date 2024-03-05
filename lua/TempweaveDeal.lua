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

    NextVerification = 0,

    Challenge = "",

    Logs = {}
}

function Log(msg)
    print(msg)
end

function generate_random_binary_string(length)
    local random_string = ""

    for i = 1, length do
        local num = math.random(0, 1)
        random_string = random_string .. num
    end

    return random_string
end

-- The Handle function must be defined before we use it
function Handle(type, fn)
    Handlers.add(
        type,
        Handlers.utils.hasMatchingTag("Action", type),
        function(msg)
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
    -- State.Logs[#State.Logs + 1] = json.encode(msg)

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
        State.NextVerification = State.CreatedAt + State.VerificationEveryPeriod -- todo: replace with Now later
    
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

function Slash()
    -- Slash half of the remaining collateral
    local Slashed = State.RemainingCollateral / 2
    State.RemainingCollateral = State.RemainingCollateral - Slashed
    State.SlashedCollateral = State.SlashedCollateral + Slashed
    State.SlashedTimes = State.SlashedTimes + 1

    -- Move the challenge
    State.NextVerification = State.NextVerification + State.VerificationEveryPeriod
    State.Challenge = ""
end

Handle("Slash", function(msg, Data)
    -- Anyone can send

    -- Only in active state
    if State.Status ~= StatusEnum.Activated then
        return
    end

    -- todo: check for expiration

    -- Too early?
    if (msg.Timestamp/1000) < State.NextVerification then
        return
    end

    -- Too late?
    if (msg.Timestamp/1000) > State.NextVerification + State.VerificationResponsePeriod then
        Slash()
    end
end)


Handle("GetChallenge", function(msg, Data)
    -- Verify that it's from the Provider
    if msg.From ~= State.Provider then
        return
    end

    -- Only in active state
    if State.Status ~= StatusEnum.Activated then
        return "Error: Not activated"
    end

    -- Too early?
    if (msg.Timestamp/1000) < State.NextVerification then
        return "Error: Too early"
    end

    -- Too late?
    if (msg.Timestamp/1000) > State.NextVerification + State.VerificationResponsePeriod then
        Slash()
        return "Error: Too late " .. State.NextVerification + State.VerificationResponsePeriod .. " // " .. (msg.Timestamp/1000)
    end

    if State.Challenge ~= "" then
        return State.Challenge
    end

    -- Let's generate the challenge
    State.Challenge = generate_random_binary_string(256)

    return State.Challenge
end)

Handle("SubmitChallenge", function(msg, Data)
    -- Verify that it's from the Provider
    if msg.From ~= State.Provider then
        return
    end

    -- Only in active state
    if State.Status ~= StatusEnum.Activated then
        return "Error: Not activated"
    end

    -- Too early?
    if (msg.Timestamp/1000) < State.NextVerification then
        return "Error: Too early"
    end

    -- Too late?
    if (msg.Timestamp/1000) > State.NextVerification + State.VerificationResponsePeriod then
        Slash()
        return "Error: Too late"
    end

    local ChallengeFromProvider = Data["Challenge"]
    if ChallengeFromProvider ~= State.Challenge then
        -- don't slash, maybe it was just out of sync
        return "Error: Challenge mismatch: " .. ChallengeFromProvider .. " != " .. State.Challenge
    end

    -- State.Logs[#State.Logs + 1] = json.encode(msg)
    -- State.Logs[#State.Logs + 1] = json.encode(msg.Data)

    local Path = Data["Path"]
    -- State.Logs[#State.Logs + 1] = json.encode(Path)

    State.Logs[#State.Logs + 1] = "Start"

    -- Walk through all elements of the path, according to the binary string State.Challenge
    local i = 1
    local ExpectedNext = State.MerkleRoot
    while true do
        local Elem = Path[i]

        if Elem == nil then
            break
        end

        local ElemValue = Elem[1]
        local ElemLeft = Elem[2]
        local ElemRight = Elem[3]

        if ElemValue == nil then
            Slash()
            return "Error: Path, i=" .. i .. ", ElemValue=nil"
        end

        if ExpectedNext ~= ElemValue then
            Slash()
            return "Error: Path, i=" .. i .. ", ExpectedNext=" .. ExpectedNext .. ", ElemValue=" .. ElemValue
        end

        local Direction = string.sub(State.Challenge, i, i)

        if Direction == nil then
            return "Error: Path, i=" .. i .. ", Direction=nil, State.Challenge=" .. State.Challenge -- todo: should we slash?
        end

        State.Logs[#State.Logs + 1] = json.encode({
            ["i"] = i, ["Direction"] = Direction, ["ElemValue"] = ElemValue, ["ElemLeft"] = ElemLeft, ["ElemRight"] = ElemRight, ["State.Challenge"] = State.Challenge
        })

        if Direction == "0" then
            if ElemLeft == nil then
                Slash()
                return "Error: Path, i=" .. i .. ", Direction=0, ElemLeft=nil"
            end
            ExpectedNext = ElemLeft
        elseif Direction == "1" then
            if ElemRight == nil then
                Slash()
                return "Error: Path, i=" .. i .. ", Direction=1, ElemRight=nil"
            end
            ExpectedNext = ElemRight
        else
            return "Error: Something went wrong, Direction=" .. Direction
        end

        -- Verify the hashes
        local ExpectedHash = ElemValue
        local LeftData = HexToBytes(ElemLeft)
        local RightData = HexToBytes(ElemRight)
        local HashData = LeftData .. RightData

        -- If this is the last element, prepend zero byte
        if Elem[i + 1] == nil then
            HashData = string.char(0) .. HashData
        end

        local Hash = sha256(HashData)
        if Hash ~= ExpectedHash then
            Slash()
            return "Error: Hash, i=" .. i .. ", ExpectedHash=" .. ExpectedHash .. ", Hash=" .. Hash
        end

        i = i + 1
    end

    -- And finally, we have ExpectedValue is the hash of the leaf
    local LeafData = base64.decode(Data["Leaf"])
    local LeafHash = sha256(LeafData)
    if ExpectedNext ~= LeafHash then
        Slash()
        return "Error: Leaf, ExpectedNext=" .. ExpectedNext .. ", LeafHash=" .. LeafHash
    end

    -- Challenge successfully passed!
    State.NextVerification = State.NextVerification + State.VerificationEveryPeriod
    State.Challenge = ""

    return "Success"
end)

Handle("GetState", function(msg)
    return json.encode(State)
end)

-- todo: withdraw collateral at the end when expires by provider

-- todo: withdraw rewards + slashed collateral at the end when expires by client