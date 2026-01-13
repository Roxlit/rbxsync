-- DataStore Handler
local DataStoreService = game:GetService("DataStoreService")

local DataStore = {}
local playerData = DataStoreService:GetDataStore("PlayerData")

function DataStore:Load(player)
    local success, data = pcall(function()
        return playerData:GetAsync(player.UserId)
    end)
    return success and data or {}
end

function DataStore:Save(player, data)
    pcall(function()
        playerData:SetAsync(player.UserId, data)
    end)
end

return DataStore
