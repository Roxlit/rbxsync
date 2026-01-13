-- Utility Functions
local Utils = {}

function Utils.lerp(a, b, t)
    return a + (b - a) * t
end

function Utils.roundToDecimal(num, places)
    local mult = 10 ^ places
    return math.floor(num * mult + 0.5) / mult
end

function Utils.tableContains(tbl, value)
    for _, v in ipairs(tbl) do
        if v == value then return true end
    end
    return false
end

return Utils
