-- Player Controller
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer

UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end
    
    if input.KeyCode == Enum.KeyCode.Space then
        print("Jump!")
    end
end)

print("[PlayerController] Loaded for", player.Name)
