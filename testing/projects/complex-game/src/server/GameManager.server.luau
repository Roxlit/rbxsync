-- Game Manager
-- Handles core game logic

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local GameManager = {}

function GameManager:Init()
    print("[GameManager] Initializing...")
    
    Players.PlayerAdded:Connect(function(player)
        print("[GameManager] Player joined:", player.Name)
    end)
end

GameManager:Init()
