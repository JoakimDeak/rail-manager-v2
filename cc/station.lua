local function includes(arr, value)
    for _, el in pairs(arr) do
        if el == value then
            return true
        end
    end
    return false
end

local function find(arr, cb)
    for _, el in ipairs(arr) do
        if cb(el) then
            return el
        end
    end
end

local function loadConfig()
    local configFile = fs.open("config.json", "r")
    local config = textutils.unserialiseJSON(configFile.readAll())
    configFile.close()

    for k, v in pairs(config) do
        rawset(_G, k, v)
    end
end

local function createConfig()
    local config = {}

    local hasServerId = false
    while not hasServerId do
        print("Computer id for server: ")
        local serverId = tonumber(read())
        if type(serverId) == "number" then
            hasServerId = true
            config.ServerId = serverId
        end
    end

    local hasNode = false
    while not hasNode do
        rednet.send(config.ServerId, {
            ["action"] = "request:externalNodes"
        })

        local _, nodes = rednet.receive()
        if not nodes then
            print("Server error when getting external nodes")
            sleep(30)
        else
            print("Select node:")
            for _, node in ipairs(nodes) do
                print(node.name)
            end
            local nodeName = read()
            local selectedNode = find(nodes, function(node)
                return node.name == nodeName
            end)
            if selectedNode then
                config.Node = selectedNode
                hasNode = true
            else
                print("Invalid node name")
            end
        end

    end

    local hasOutputSide = false
    while not hasOutputSide do
        print("Select output side for redstone:")
        local sides = redstone.getSides()
        for _, side in ipairs(sides) do
            print(side)
        end
        local input = read()
        if includes(sides, input) then
            config.OutputSide = input
            hasOutputSide = true
        end
    end

    local configFile = fs.open("config.json", "w")
    configFile.write(textutils.serialiseJSON(config))
    configFile.close()

end

local function isConfigValid()
    local configFile = fs.open("config.json", "r")
    if not configFile then
        return false
    end
    local ok, config = pcall(textutils.unserialiseJSON, configFile.readAll())
    if not ok or config == nil then
        return false
    end
    if type(config.ServerId) ~= "number" then
        return false
    end
    if type(config.Node) ~= "table" then
        return false
    end
    if not includes(redstone.getSides(), config.OutputSide) then
        return false
    end

    return true
end

local function selectDestination()
    local destinationIsValid = false
    while not destinationIsValid do
        rednet.send(ServerId, {
            ["action"] = "request:externalNodes"
        })

        local _, externalNodes = rednet.receive()
        if not externalNodes then
            print("Server error when getting external nodes")
            sleep(30)
        else
            print("Select destination:")
            for _, node in ipairs(externalNodes) do
                if node.id ~= Node.id then
                    print(node.name)
                end
            end
            local selectedNode
            while not selectedNode do
                local input = read()
                selectedNode = find(externalNodes, function(node)
                    return node.name == input
                end)
            end
            rednet.send(ServerId, {
                ["action"] = "set:route",
                ["from"] = Node.id,
                ["to"] = selectedNode.id
            })
            local _, res = rednet.receive()
            if res.success then
                redstone.setOutput(OutputSide, true)
                sleep(5)
                redstone.setOutput(OutputSide, false)
            else
                print("Error setting route")
            end
        end
    end
end

local function main()
    peripheral.find("modem", rednet.open)
    if not rednet.isOpen() then
        error("Could not open rednet, is modem missing?")
    end
    if not isConfigValid() then
        createConfig()
    end
    loadConfig()

    print("Finished config for " .. textutils.serialiseJSON(Node))

    rednet.send(ServerId, {
        ["action"] = "connect",
        ["nodeId"] = Node.id
    })

    while true do
        selectDestination()
    end
end

main()
