--!strict
--[[
    Terrain Handler

    Extracts terrain voxel data using ReadVoxels API.
    Stores as binary chunks for efficient storage.
]]

local Terrain = workspace:FindFirstChildOfClass("Terrain")

-- Configuration
local CHUNK_SIZE = 64 -- Voxels per chunk dimension
local RESOLUTION = 4 -- Voxel resolution

export type TerrainChunk = {
    x: number,
    y: number,
    z: number,
    materials: {number}, -- Material enum values
    occupancies: {number}, -- 0-255 quantized
}

export type TerrainData = {
    chunkSize: number,
    resolution: number,
    region: {
        min: {number},
        max: {number},
    },
    chunks: {TerrainChunk},
    properties: {[string]: any},
}

local TerrainHandler = {}

-- Get terrain bounding region
local function getTerrainBounds(): (Vector3, Vector3)?
    if not Terrain then
        return nil
    end

    -- Try to get terrain size from properties
    local ok, maxExtents = pcall(function()
        return Terrain.MaxExtents
    end)

    if ok and maxExtents then
        return maxExtents.Min, maxExtents.Max
    end

    -- Fallback to manual bounds
    return Vector3.new(-2048, -512, -2048), Vector3.new(2048, 512, 2048)
end

-- Check if a chunk has any non-air voxels
local function hasContent(materials: {{{Enum.Material}}}): boolean
    for x, plane in materials do
        for y, row in plane do
            for z, material in row do
                if material ~= Enum.Material.Air then
                    return true
                end
            end
        end
    end
    return false
end

-- Flatten 3D array to 1D for serialization
local function flattenMaterials(materials: {{{Enum.Material}}}): {number}
    local result = {}
    for x, plane in materials do
        for y, row in plane do
            for z, material in row do
                table.insert(result, material.Value)
            end
        end
    end
    return result
end

-- Flatten and quantize occupancies
local function flattenOccupancies(occupancies: {{{number}}}): {number}
    local result = {}
    for x, plane in occupancies do
        for y, row in plane do
            for z, occ in row do
                -- Quantize to 0-255
                table.insert(result, math.floor(occ * 255 + 0.5))
            end
        end
    end
    return result
end

-- RLE compress an array of numbers (for materials which are often repetitive)
local function rleCompress(data: {number}): {number}
    if #data == 0 then
        return {}
    end

    local result = {}
    local current = data[1]
    local count = 1

    for i = 2, #data do
        if data[i] == current and count < 255 then
            count += 1
        else
            table.insert(result, count)
            table.insert(result, current)
            current = data[i]
            count = 1
        end
    end

    -- Don't forget the last run
    table.insert(result, count)
    table.insert(result, current)

    return result
end

-- Extract terrain chunk at given position
local function extractChunk(chunkX: number, chunkY: number, chunkZ: number): TerrainChunk?
    if not Terrain then
        return nil
    end

    local worldSize = CHUNK_SIZE * RESOLUTION

    local minPos = Vector3.new(
        chunkX * worldSize,
        chunkY * worldSize,
        chunkZ * worldSize
    )

    local maxPos = Vector3.new(
        minPos.X + worldSize,
        minPos.Y + worldSize,
        minPos.Z + worldSize
    )

    local region = Region3.new(minPos, maxPos)

    -- Read voxels
    local ok, materials, occupancies = pcall(function()
        return Terrain:ReadVoxels(region, RESOLUTION)
    end)

    if not ok then
        warn("[RbxSync] Failed to read terrain chunk at", chunkX, chunkY, chunkZ)
        return nil
    end

    -- Skip empty chunks
    if not hasContent(materials) then
        return nil
    end

    -- Flatten and compress
    local flatMaterials = flattenMaterials(materials)
    local flatOccupancies = flattenOccupancies(occupancies)

    return {
        x = chunkX,
        y = chunkY,
        z = chunkZ,
        materials = rleCompress(flatMaterials),
        occupancies = flatOccupancies, -- Don't RLE occupancies, they're more varied
    }
end

-- Extract all terrain
function TerrainHandler.extractTerrain(): TerrainData?
    if not Terrain then
        return nil
    end

    print("[RbxSync] Extracting terrain...")

    local minBound, maxBound = getTerrainBounds()
    if not minBound or not maxBound then
        return nil
    end

    -- Calculate chunk range
    local worldSize = CHUNK_SIZE * RESOLUTION

    local minChunk = Vector3.new(
        math.floor(minBound.X / worldSize),
        math.floor(minBound.Y / worldSize),
        math.floor(minBound.Z / worldSize)
    )

    local maxChunk = Vector3.new(
        math.ceil(maxBound.X / worldSize),
        math.ceil(maxBound.Y / worldSize),
        math.ceil(maxBound.Z / worldSize)
    )

    local chunks: {TerrainChunk} = {}
    local totalChunks = 0
    local nonEmptyChunks = 0

    for x = minChunk.X, maxChunk.X do
        for y = minChunk.Y, maxChunk.Y do
            for z = minChunk.Z, maxChunk.Z do
                totalChunks += 1
                local chunk = extractChunk(x, y, z)
                if chunk then
                    table.insert(chunks, chunk)
                    nonEmptyChunks += 1
                end
            end
        end

        -- Yield periodically
        if x % 4 == 0 then
            task.wait()
        end
    end

    print(string.format("[RbxSync] Terrain extraction complete: %d/%d non-empty chunks",
        nonEmptyChunks, totalChunks))

    -- Get terrain properties
    local properties = {}
    local propNames = {
        "WaterColor", "WaterReflectance", "WaterTransparency",
        "WaterWaveSize", "WaterWaveSpeed", "Decoration"
    }

    for _, propName in propNames do
        local ok, value = pcall(function()
            return (Terrain :: any)[propName]
        end)
        if ok then
            if typeof(value) == "Color3" then
                properties[propName] = { r = value.R, g = value.G, b = value.B }
            else
                properties[propName] = value
            end
        end
    end

    return {
        chunkSize = CHUNK_SIZE,
        resolution = RESOLUTION,
        region = {
            min = { minBound.X, minBound.Y, minBound.Z },
            max = { maxBound.X, maxBound.Y, maxBound.Z },
        },
        chunks = chunks,
        properties = properties,
    }
end

return TerrainHandler
