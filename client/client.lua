local apiBase = "http://localhost:3100/api"

local programName = shell.getRunningProgram()
if programName ~= "rom/programs/http/pastebin.lua" then
    if not fs.exists("./startup") then
        local startup = fs.open("./startup", "w")
        startup.write('shell.run("' .. programName .. '")')
        startup.close()
    end
end

while true do
    local statusRes = http.get(apiBase .. "/status")
    if statusRes then
        break
    else
        print("Could not connect to server, sleeping")
        sleep(30)
    end
end

local configuredNode = nil
if not fs.exists("./node.json") then
    local nodesRes = textutils.unserialiseJSON(http.get(apiBase .. "/nodes", {
        ["Accept"] = "application/json"
    }).readAll())

    print("Select node")
    print("-----")
    -- TODO: Print multiple on line if the list is taller than the terminal window
    for _, node in pairs(nodesRes.nodes) do
        print(node.name)
    end
    print("-----")
    local nodeName = read()

    for _, node in pairs(nodesRes.nodes) do
        if node.name == nodeName then
            configuredNode = node
            break
        end
    end

    local idFile = fs.open("./node.json", "w")
    idFile.write(textutils.serialiseJSON(configuredNode))
    idFile.close()
else
    local idFile = fs.open("./node.json", "r")
    configuredNode = textutils.unserialiseJSON(idFile.readAll())
    idFile.close()
end

local nodeRes = http.get(apiBase .. "/nodes/" .. configuredNode.id)
if not nodeRes or not configuredNode then
    print("Node could not be found resetting config")
    fs.delete("./node-id.txt")
    return
end

print("Running client for: " .. configuredNode.name)

local edgesRes = textutils.unserialiseJSON(http.get(apiBase .. "/nodes/" .. configuredNode.id .. "/edges", {
    ["Accept"] = "application/json"
}).readAll())
local numOfEdges = table.getn(edgesRes.edges)

function Station()
    print("Running as station")
    while (true) do
        term.clear()
        print("Select destination")
        print("-----")
        local nodesRes = textutils.unserialiseJSON(http.get(apiBase .. "/nodes", {
            ["Accept"] = "application/json"
        }).readAll())
        for _, node in pairs(nodesRes.nodes) do
            if node.edgeCount == 1 then
                print(node.name)
            end
        end
        print("----")
        local destination = read()
        for _, node in pairs(nodesRes.nodes) do
            if destination == node.name then
                http.post(apiBase .. "/journeys", textutils.serialiseJSON({
                    ["from"] = configuredNode.name,
                    ["to"] = destination
                }))
                redstone.setOutput("bottom", true)
                sleep(1)
                redstone.setOutput("bottom", false)
                break
            end
        end
    end
end

function Junction()
    print("Running as junction")

    local connectedNodes = {}
    for i, edge in pairs(edgesRes.edges) do
        local connectedNode = nil
        if edge.node1 == configuredNode.id then
            connectedNode = edge.node2
        else
            connectedNode = edge.node1
        end
        connectedNodes[i] = connectedNode
    end

    if not fs.exists("./route-config.json") then

        local nodesRes = textutils.unserialiseJSON(http.get(apiBase .. "/nodes", {
            ["Accept"] = "application/json"
        }).readAll())

        local config = {}
        local routeConfig = fs.open("./route-config.json", "w")
        for _, a in pairs(connectedNodes) do
            for __, b in pairs(connectedNodes) do
                if a ~= b then
                    local aName = nil
                    local bName = nil

                    for _, node in pairs(nodesRes.nodes) do
                        if node.id == a then
                            aName = node.name
                        end
                        if node.id == b then
                            bName = node.name
                        end
                    end

                    print("Enter state (0|1) for " .. aName .. "->" .. bName)
                    local state = read()
                    config[a .. "," .. b] = state
                end
            end
        end
        routeConfig.write(textutils.serialiseJSON(config))
        routeConfig.close()
    end

    local routeConfigFile = fs.open("./route-config.json", "r")
    local config = textutils.unserialiseJSON(routeConfigFile.readAll())

    local ws = http.websocket("ws://localhost:3000?nodeId=" .. configuredNode.id)
    if not ws then
        error("Could not connect")
    end

    print("Connection opened")

    if fs.exists("./state.txt") then
        local savedStateFile = fs.open("./state.txt", "r")
        local savedState = savedStateFile.readAll()
        savedStateFile.close()
        if savedState == "0" then
            redstone.setOutput("back", false)
        elseif savedState == "1" then
            redstone.setOutput("back", true)
        else
            print("Invalid saved state, disregarding")
        end
    end

    while true do
        local message = ws.receive()
        if message then
            local state = config[message]
            if (state == "0") then
                redstone.setOutput("back", false)
            elseif state == "1" then
                redstone.setOutput("back", true)
            else
                error("Invalid state")
            end
            local saveStateFile = fs.open("./state.txt", "w")
            saveStateFile.write(state)
            saveStateFile.close()
        end
    end

end

if numOfEdges == 0 then
    print("Node has no edges")
elseif numOfEdges == 1 then
    while true do
        local ok, err = pcall(Station)
        if not ok then
            print("Got error: " .. err)
            print("Restarting")
            sleep(30)
        end
    end
else
    while true do
        local ok = pcall(Junction)
        if not ok then
            print("Waiting to reconnect")
            sleep(30)
        end
    end
end
