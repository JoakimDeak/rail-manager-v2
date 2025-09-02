local apiBase = "http://localhost:3000/api/trpc"
local websocketUrl = "ws://localhost:3100"

local function _encode_uri_char(char)
    return string.format('%%%0X', string.byte(char))
end

local function encode_uri(uri)
    return (string.gsub(uri, "[^%a%d%-_%.!~%*'%(%);/%?:@&=%+%$,#]", _encode_uri_char))
end

local function fetch(method, endpoint, payload)
    local res, err
    if method == "post" then
        res, err = http.post(apiBase .. "/" .. endpoint, payload and textutils.serialiseJSON({
            ["json"] = payload
        }) or "", {
            ["Authorization"] = endpoint == "auth.generateRefreshToken" and "" or endpoint == "auth.generateAccessToken" and
                "Bearer " .. RefreshToken or "Bearer " .. AccessToken,
            ["Content-Type"] = "application/json"
        })
    elseif method == "get" then
        res, err = http.get(apiBase .. "/" .. endpoint .. "?input=" .. encode_uri(textutils.serialiseJSON({
            ["json"] = payload
        })), {
            ["Authorization"] = "Bearer " .. AccessToken,
            ["Content-Type"] = "application/json"
        })
    end

    if res == nil then
        print(err)
        return
    end

    local jsonRes = textutils.unserialiseJSON(res.readAll())

    return jsonRes.result.data.json
end

local function loadRefreshToken()
    local refreshTokenFile = fs.open("refreshToken.txt", "r")
    if not refreshTokenFile then
        return
    end
    RefreshToken = refreshTokenFile.readAll()
    refreshTokenFile.close()
end

local function removeRefreshToken()
    RefreshToken = nil
    pcall(fs.delete, "refreshToken.txt")
end

local function getTokens()
    print("Email:")
    local email = read()
    print("Authenticator code:")
    local code = read()

    local res = fetch("post", "auth.generateRefreshToken", {
        ["email"] = email,
        ["code"] = code
    })

    if not res then
        return false
    end

    return true, res.refreshToken, res.accessToken
end

local function setTokens()
    while not RefreshToken do
        local ok, refreshToken, accessToken = getTokens()
        if ok then
            local refreshTokenFile = fs.open("refreshToken.txt", "w")
            refreshTokenFile.write(refreshToken)
            refreshTokenFile.close()

            RefreshToken = refreshToken
            AccessToken = accessToken
        end
    end
end

local function getAccessToken()
    local res = fetch("post", "auth.generateAccessToken")
    if not res then
        return false
    end

    return true, res.accessToken
end

local function setCredentials()
    loadRefreshToken()
    if not RefreshToken then
        setTokens()
    end
    if not AccessToken then
        local ok, accessToken = getAccessToken()
        if ok then
            AccessToken = accessToken
        else
            removeRefreshToken()
            setTokens()
        end
    end
end

local function createConfig()
    local config = {}

    local worlds = fetch("get", "world.getAll")
    if not worlds then
        error("Could not fetch worlds")
    end

    local selectedWorld
    local isValidSelection = false
    while not isValidSelection do
        print("Worlds:")
        for _, world in ipairs(worlds) do
            print(world.name)
        end
        print("Select world:")
        local selectedName = read()
        for _, world in ipairs(worlds) do
            if world.name == selectedName then
                isValidSelection = true
                selectedWorld = world
            end
        end
        if not isValidSelection then
            print("Invalid world name")
        end
    end

    config.WorldId = selectedWorld.id

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
    if type(config.WorldId) ~= "number" then
        return false
    end

    return true
end

local function loadConfig()
    local configFile = fs.open("config.json", "r")
    local config = textutils.unserialiseJSON(configFile.readAll())
    configFile.close()

    for k, v in pairs(config) do
        rawset(_G, k, v)
    end
end

local function configureRednet()
    local nodes = fetch("get", "node.getAll", {
        ["worldId"] = WorldId
    })
    if not nodes then
        -- TODO: this should really only fail if accessToken is expired so should trigger reauthing
        error("Could not fetch nodes")
    end
    MessageBuffer = {}
    for _, node in ipairs(nodes) do
        MessageBuffer["n" .. node.id] = {
            ["computerId"] = nil,
            ["lastMessage"] = nil
        }
    end

    peripheral.find("modem", rednet.open)
end

local function connectWebSocket()
    while not WsConnection do
        WsConnection = http.websocket(websocketUrl .. "?worldId=" .. WorldId)
        if not WsConnection then
            print("couldnt connect, sleeping")
            sleep(30)
        else
            print("connected to websocket server")
        end
    end
end

-- TODO: Add print on server disconnect
local function websocketHandler()
    connectWebSocket()
    while true do
        local ok, message = pcall(WsConnection.receive)
        if not ok or message == nil then
            WsConnection = nil
            sleep(30)
            connectWebSocket()
            break
        end
        local messageJson = textutils.unserialiseJSON(message)
        if messageJson and messageJson.success then
            local path = messageJson.path
            print("got path " .. textutils.serialiseJSON(path))

            local origin = MessageBuffer["n" .. path[1]].computerId
            rednet.send(origin, {
                ["success"] = true
            })

            for i = 2, #path - 1 do
                local node = path[i]
                local routeMessage = path[i - 1] .. "-" .. path[i + 1]
                local receiver = MessageBuffer["n" .. node].computerId
                if not receiver then
                    MessageBuffer["n" .. node].lastMessage = routeMessage
                else
                    -- TODO: Add acking for all messages from server to client
                    rednet.send(receiver, routeMessage)
                    -- if not received then
                    --     MessageBuffer["n" .. node].lastMessage = routeMessage
                    -- end
                end
            end
        end
    end
end

local function rednetHandler()
    configureRednet()
    print("Running server from computer: " .. os.getComputerID())
    while true do
        local sender, message = rednet.receive()

        if message.action == "connect" then
            local bufferId = "n" .. message.nodeId
            MessageBuffer[bufferId].computerId = sender

            local lastMessage = MessageBuffer[bufferId].lastMessage
            if lastMessage ~= nil then
                rednet.send(sender, lastMessage)
                MessageBuffer[bufferId].lastMessage = nil
            end
        elseif message.action == "request:worldId" then
            rednet.send(sender, {
                ["worldId"] = WorldId
            })
        elseif message.action == "request:internalNodes" then
            local nodes = fetch("get", "node.getAllInternal", {
                ["worldId"] = WorldId
            })
            rednet.send(sender, nodes)
        elseif message.action == "request:externalNodes" then
            local nodes = fetch("get", "node.getAllExternal", {
                ["worldId"] = WorldId
            })
            rednet.send(sender, nodes)
        elseif message.action == "request:connectedNodes" then
            local connectedNodes = fetch("get", "node.getConnectedNodes", {
                ["nodeId"] = message.nodeId
            })
            rednet.send(sender, connectedNodes)
        elseif message.action == "set:route" then
            WsConnection.send(textutils.serialiseJSON({
                ["worldId"] = WorldId,
                ["from"] = message.from,
                ["to"] = message.to
            }))
        else
            print("Unsupported action " .. message.action)
        end

    end
end

local function listen()
    parallel.waitForAny(websocketHandler, rednetHandler)
end

-- TODO: what happens if a refresh token is revoked while the program runs?
-- TODO: what happen if an access token is revoked while the program runs?
local function main()
    setCredentials()
    if not isConfigValid() then
        createConfig()
    end
    loadConfig()

    while true do
        listen()
    end
end

main()
