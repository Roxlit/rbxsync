--!strict
--[[
    CSG Handler

    Handles UnionOperation, NegateOperation, and IntersectOperation instances.
    Since we can't directly read the mesh data, we store asset references.
]]

export type CSGData = {
    className: string,
    assetId: string?,
    usePartColor: boolean,
    smoothingAngle: number,
    hasCollision: boolean,
}

local CSGHandler = {}

-- Check if an instance is a CSG operation
function CSGHandler.isCSGOperation(instance: Instance): boolean
    local className = instance.ClassName
    return className == "UnionOperation"
        or className == "NegateOperation"
        or className == "IntersectOperation"
end

-- Extract CSG data from an operation
function CSGHandler.extractCSGData(instance: Instance): CSGData?
    if not CSGHandler.isCSGOperation(instance) then
        return nil
    end

    local className = instance.ClassName

    -- Try to get AssetId (may not always be available)
    local assetId: string? = nil
    local ok, id = pcall(function()
        return (instance :: any).AssetId
    end)
    if ok and id and id ~= "" then
        assetId = id
    end

    -- Get common properties
    local usePartColor = false
    local smoothingAngle = 0
    local hasCollision = true

    pcall(function()
        usePartColor = (instance :: any).UsePartColor
    end)

    pcall(function()
        smoothingAngle = (instance :: any).SmoothingAngle
    end)

    pcall(function()
        -- Check if collision is enabled via CanCollide
        hasCollision = (instance :: any).CanCollide
    end)

    return {
        className = className,
        assetId = assetId,
        usePartColor = usePartColor,
        smoothingAngle = smoothingAngle,
        hasCollision = hasCollision,
    }
end

-- Note: Full mesh data extraction would require either:
-- 1. Saving the union to an rbxm file and parsing it
-- 2. Using EditableMesh (if the union can be converted)
-- 3. Re-creating from source parts (if tracked)
--
-- For now, we store the AssetId reference which allows
-- Roblox to reconstruct the mesh on sync.

return CSGHandler
