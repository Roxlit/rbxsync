--!strict
--[[
    RbxSync Studio Plugin

    Extracts complete game DataModel with ALL properties using reflection.
    Communicates with local RbxSync server via HTTP.
]]

local HttpService = game:GetService("HttpService")
local Selection = game:GetService("Selection")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

-- Configuration
local SERVER_URL = "http://localhost:44755"
local POLL_INTERVAL = 1 -- seconds
local CHUNK_SIZE = 500 -- instances per chunk

-- Load modules
local Reflection = require(script.Parent.Reflection)
local Serializer = require(script.Parent.Serializer)

-- Plugin state
local isConnected = false
local isExtracting = false

-- HTTP helpers
local function httpGet(endpoint: string): (boolean, any)
    local success, result = pcall(function()
        return HttpService:GetAsync(SERVER_URL .. endpoint)
    end)

    if success then
        local ok, data = pcall(function()
            return HttpService:JSONDecode(result)
        end)
        return ok, data
    end

    return false, result
end

local function httpPost(endpoint: string, data: any): (boolean, any)
    local success, result = pcall(function()
        local json = HttpService:JSONEncode(data)
        return HttpService:PostAsync(SERVER_URL .. endpoint, json, Enum.HttpContentType.ApplicationJson)
    end)

    if success then
        local ok, decoded = pcall(function()
            return HttpService:JSONDecode(result)
        end)
        return ok, decoded
    end

    return false, result
end

-- Send extraction chunk
local function sendChunk(sessionId: string, chunkIndex: number, totalChunks: number, instances: {any})
    local success, result = httpPost("/extract/chunk", {
        session_id = sessionId,
        chunk_index = chunkIndex,
        total_chunks = totalChunks,
        data = instances,
    })

    if not success then
        warn("[RbxSync] Failed to send chunk:", result)
    end

    return success
end

-- Extract full game
local function extractGame(config: {any})
    if isExtracting then
        warn("[RbxSync] Extraction already in progress")
        return
    end

    isExtracting = true
    local startTime = os.clock()

    print("[RbxSync] Starting game extraction...")

    -- Initialize reflection engine with API dump
    local apiDump = Reflection.loadAPIDump()
    if not apiDump then
        warn("[RbxSync] Failed to load API dump")
        isExtracting = false
        return
    end

    print("[RbxSync] Loaded API dump with", #apiDump.Classes, "classes")

    -- Determine which services to extract
    local servicesToExtract = config.services or {
        "Workspace",
        "ReplicatedStorage",
        "ReplicatedFirst",
        "ServerScriptService",
        "ServerStorage",
        "StarterGui",
        "StarterPack",
        "StarterPlayer",
        "Lighting",
        "SoundService",
        "Teams",
        "Chat",
        "LocalizationService",
        "TestService",
    }

    -- Collect all instances to serialize
    local allInstances: {Instance} = {}

    for _, serviceName in servicesToExtract do
        local service = game:FindFirstChild(serviceName)
        if service then
            table.insert(allInstances, service)
            for _, descendant in service:GetDescendants() do
                table.insert(allInstances, descendant)
            end
        end
    end

    print("[RbxSync] Found", #allInstances, "instances to extract")

    -- Calculate chunks
    local totalChunks = math.ceil(#allInstances / CHUNK_SIZE)
    local sessionId = HttpService:GenerateGUID(false)

    -- Serialize and send in chunks
    for chunkIndex = 0, totalChunks - 1 do
        local startIdx = chunkIndex * CHUNK_SIZE + 1
        local endIdx = math.min(startIdx + CHUNK_SIZE - 1, #allInstances)

        local chunkInstances = {}
        for i = startIdx, endIdx do
            local instance = allInstances[i]
            local serialized = Serializer.serializeInstance(instance, apiDump)
            if serialized then
                table.insert(chunkInstances, serialized)
            end
        end

        print(string.format("[RbxSync] Sending chunk %d/%d (%d instances)",
            chunkIndex + 1, totalChunks, #chunkInstances))

        local success = sendChunk(sessionId, chunkIndex, totalChunks, chunkInstances)
        if not success then
            warn("[RbxSync] Extraction failed at chunk", chunkIndex + 1)
            isExtracting = false
            return
        end

        -- Yield to prevent freezing Studio
        if chunkIndex % 5 == 0 then
            task.wait()
        end
    end

    local elapsed = os.clock() - startTime
    print(string.format("[RbxSync] Extraction complete! %d instances in %.2fs", #allInstances, elapsed))

    isExtracting = false
end

-- Handle incoming commands from server
local function handleCommand(command: string, payload: any)
    if command == "extract:start" then
        extractGame(payload or {})
    elseif command == "ping" then
        print("[RbxSync] Received ping")
    else
        warn("[RbxSync] Unknown command:", command)
    end
end

-- Main polling loop
local function pollLoop()
    while true do
        if isConnected then
            local success, response = httpGet("/request")

            if success and response and response.command then
                print("[RbxSync] Received command:", response.command)

                task.spawn(function()
                    local recording = ChangeHistoryService:TryBeginRecording("RbxSync")

                    local ok, err = pcall(function()
                        handleCommand(response.command, response.payload)
                    end)

                    if not ok then
                        warn("[RbxSync] Command error:", err)
                    end

                    if recording then
                        ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
                    end

                    -- Send response
                    if response.id then
                        httpPost("/response", {
                            id = response.id,
                            success = ok,
                            data = ok and {} or nil,
                            error = not ok and tostring(err) or nil,
                        })
                    end
                end)
            end
        end

        task.wait(POLL_INTERVAL)
    end
end

-- Check server connection
local function checkConnection()
    local success, _ = httpGet("/health")

    if success ~= isConnected then
        isConnected = success
        if isConnected then
            print("[RbxSync] Connected to server")
        else
            print("[RbxSync] Disconnected from server")
        end
    end
end

-- Create toolbar button
local toolbar = plugin:CreateToolbar("RbxSync")
local toggleButton = toolbar:CreateButton(
    "Toggle RbxSync",
    "Connect/disconnect from RbxSync server",
    "rbxassetid://6031075931" -- Generic sync icon
)

local extractButton = toolbar:CreateButton(
    "Extract Game",
    "Extract current game to files",
    "rbxassetid://6031075929" -- Download icon
)

toggleButton.Click:Connect(function()
    isConnected = not isConnected
    toggleButton:SetActive(isConnected)

    if isConnected then
        print("[RbxSync] Enabled - connecting to server...")
        checkConnection()
    else
        print("[RbxSync] Disabled")
    end
end)

extractButton.Click:Connect(function()
    if not isConnected then
        warn("[RbxSync] Not connected to server. Click Toggle button first.")
        return
    end

    extractGame({})
end)

-- Start background tasks
task.spawn(pollLoop)
task.spawn(function()
    while true do
        if isConnected then
            checkConnection()
        end
        task.wait(5)
    end
end)

print("[RbxSync] Plugin loaded. Click toolbar button to connect.")
