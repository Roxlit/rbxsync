--!strict
--[[
    Logger Module

    Captures LogService output and sends it to the Roxlit launcher log server.
    Replaces the standalone RoxlitDebug plugin — now built into the unified Roxlit plugin.
    If the launcher is not running, silently does nothing.
]]

local HttpService = game:GetService("HttpService")
local LogService = game:GetService("LogService")

local Logger = {}

-- Configuration
local LAUNCHER_URL = "http://127.0.0.1:19556"
local BATCH_INTERVAL = 0.5
local BATCH_MAX = 50
local HEALTH_INTERVAL = 10

-- State
local buffer: {{message: string, level: string, timestamp: number}} = {}
local serverAlive = false
local lastHealthCheck = 0
local connection: RBXScriptConnection? = nil
local flushThread: thread? = nil

local function checkHealth()
    local ok, _ = pcall(function()
        HttpService:GetAsync(LAUNCHER_URL .. "/health")
    end)
    serverAlive = ok
    lastHealthCheck = os.clock()
end

local function flushBuffer()
    if #buffer == 0 or not serverAlive then
        return
    end

    local batch = buffer
    buffer = {}

    pcall(function()
        local json = HttpService:JSONEncode(batch)
        HttpService:PostAsync(LAUNCHER_URL .. "/log", json, Enum.HttpContentType.ApplicationJson)
    end)
end

local function levelFromType(messageType: Enum.MessageType): string
    if messageType == Enum.MessageType.MessageError then
        return "error"
    elseif messageType == Enum.MessageType.MessageWarning then
        return "warn"
    end
    return "info"
end

--- Start capturing logs and sending to launcher.
function Logger.start()
    if connection then
        return -- Already started
    end

    -- Initial health check
    checkHealth()

    -- Connect to LogService
    connection = LogService.MessageOut:Connect(function(message: string, messageType: Enum.MessageType)
        if not serverAlive then
            return
        end

        table.insert(buffer, {
            message = message,
            level = levelFromType(messageType),
            timestamp = os.clock(),
        })

        if #buffer >= BATCH_MAX then
            flushBuffer()
        end
    end)

    -- Periodic flush + health check
    flushThread = task.spawn(function()
        while connection do
            task.wait(BATCH_INTERVAL)

            if os.clock() - lastHealthCheck >= HEALTH_INTERVAL then
                checkHealth()
            end

            flushBuffer()
        end
    end)
end

--- Stop capturing logs.
function Logger.stop()
    if connection then
        connection:Disconnect()
        connection = nil
    end

    if flushThread then
        task.cancel(flushThread)
        flushThread = nil
    end

    -- Flush remaining
    flushBuffer()
    buffer = {}
end

--- Check if the launcher log server is reachable.
function Logger.isLauncherAlive(): boolean
    return serverAlive
end

--- Query launcher status (is "Start Development" active?).
--- Returns nil if launcher is not running.
function Logger.getLauncherStatus(): {active: boolean, projectPath: string, projectName: string}?
    local ok, result = pcall(function()
        local response = HttpService:GetAsync(LAUNCHER_URL .. "/status")
        return HttpService:JSONDecode(response)
    end)

    if ok and result then
        return result :: any
    end
    return nil
end

--- Send placeId and universeId link to launcher.
function Logger.linkPlace(placeId: number, universeId: number, placeName: string)
    pcall(function()
        HttpService:PostAsync(
            LAUNCHER_URL .. "/link-place",
            HttpService:JSONEncode({ placeId = placeId, universeId = universeId, placeName = placeName }),
            Enum.HttpContentType.ApplicationJson
        )
    end)
end

return Logger
