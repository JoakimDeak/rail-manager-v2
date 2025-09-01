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
        local sent = rednet.send(config.ServerId, {
            ["action"] = "request:internalNodes"
        })
        if sent then
            local _, nodes = rednet.receive()
            if not nodes then
                print("Server error when getting internal nodes")
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
        else
            print("Could not connect to server")
            sleep(30)
        end
    end

    config.Routes = {}
    local hasRoutes = false
    while not hasRoutes do
        local sent = rednet.send(config.ServerId, {
            ["action"] = "request:connectedNodes",
            ["nodeId"] = config.Node.id
        })
        if sent then
            local _, connectedNodes = rednet.receive()
            if not connectedNodes then
                print("Server error when getting connected nodes")
                sleep(30)
            else
                for _, nodeA in ipairs(connectedNodes) do
                    for _, nodeB in ipairs(connectedNodes) do
                        if nodeA.id ~= nodeB.id then
                            local inputIsValid = false
                            while not inputIsValid do
                                print("State for " .. nodeA.name .. " to " .. nodeB.name .. " (off|on):")
                                local input = read()
                                if input == "off" or input == "on" then
                                    inputIsValid = true
                                    config.Routes[nodeA.id .. "-" .. nodeB.id] = input
                                else
                                    print("Invalid state")
                                end
                            end
                        end
                    end
                end
                hasRoutes = true
            end
        else
            print("Could not connect to server")
            sleep(30)
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
    if type(config.Routes) ~= "table" then
        -- TODO?: Validate actual structure
        return false
    end
    if not includes(redstone.getSides(), config.OutputSide) then
        return false
    end

    return true
end

local function rednetListener()

    local sender, message = rednet.receive()
    if sender ~= ServerId then
        return
    end

    if not type(message) == "string" then
        -- TODO?: Check with regex
        return
    end

    local requestedState = Routes[message]
    if not requestedState then
        print("Unknown route " .. message)
    elseif requestedState == "on" then
        redstone.setOutput(OutputSide, true)
    elseif requestedState == "off" then
        redstone.setOutput(OutputSide, false)
    else
        print("Invalid state " .. requestedState)
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

    rednet.send(ServerId, {
        ["action"] = "connect",
        ["nodeId"] = Node.id
    })

    print("Listening for route requests")
    while true do
        rednetListener()
    end
end

main()
