function HexToBytes(str)
    return (str:gsub('..', function (cc)
        return string.char(tonumber(cc, 16))
    end))
end

function BytesToHex(str)
    return (str:gsub('.', function (c)
        return string.format('%02x', string.byte(c))
    end))
end