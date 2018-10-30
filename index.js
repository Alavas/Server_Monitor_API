const express = require('express')
const _ = require('lodash')
const http = require('http')
const ws = require('ws')
const ping = require('domain-ping')
const wmi = require('node-wmi')
const util = require('util')
const wmiQuery = util.promisify(wmi.Query)

var ServerList = require('./test-servers')

const app = express()
const server = http.Server(app)
const wss = new ws.Server({ server })

const checkServices = require('./check-services')(wmiQuery)

app.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    next()
});

app.use(express.static('public'))

checkServers()

//Iterate through the ServerList object to determine if hosts are online.
async function checkServers() {
    while (true) {
        console.log("Start Server Check", new Date())
        for (var server in ServerList) {
            await hostOnline(server, ServerList[server].Hosts)
            if (ServerList[server].Hosts[0].Online && ServerList[server].Services.length > 0) {
                await serviceState(server, ServerList[server].Services)
            }
            await operationalCheck(server)
            await new Promise((resolve, reject) => setTimeout(resolve, 3000))
        }
    }
}

//Gets state of each service and updates the servers object.
async function serviceState(server, services) {
    console.log("Checking services on", server)
    let computer = ServerList[server].HostName
    let state
    let svcState = await checkServices(computer)
        .then()
        .catch(err => console.log(err.message))
    for (const [index, service] of services.entries()) {
        if (!_.isUndefined(svcState)) {
            let svc = svcState.find(x => x.Name === service.Name) || []
            state = {
                "Name": service.Name,
                "Description": service.Description,
                "Running": svc.Started || false,
                "State": svc.State || "Stopped"
            }
        } else {
            state = {
                "Name": service.Name,
                "Description": service.Description,
                "Running": false,
                "State": "Stopped"
            }
        }
        //Only update the ServerList object if a change has been made. Update all WebSocket clients.
        if (!_.isEqual(ServerList[server].Services[index], state)) {
            ServerList[server].Services[index] = state
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.OPEN) {
                    client.send(JSON.stringify({
                        'action': 'UPDATE_DATA_SERVICES',
                        'data': {
                            'server': server,
                            'index': index,
                            'data': state
                        }
                    }))
                }
            })
        }
    }
}

//Pings each server.
async function hostOnline(server, hosts) {
    console.log("Checking hosts for", server)
    for (const [index, host] of hosts.entries()) {
        let hostState = await ping(host.IP)
            .then(output => {
                let state = {
                    "Name": host.Name,
                    "IP": host.IP,
                    "Online": output.ping
                }
                return state
            })
            .catch(err => {
                let state = {
                    "Name": host.Name,
                    "IP": host.IP,
                    "Online": false
                }
                return state
            })
        //Only update the ServerList object if a change has been made.  Update all WebSocket clients.
        if (!_.isEqual(ServerList[server].Hosts[index], hostState)) {
            ServerList[server].Hosts[index] = hostState
            console.log("Ping Update", hostState)
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws.OPEN) {
                    client.send(JSON.stringify({
                        'action': 'UPDATE_DATA_HOSTS',
                        'data': {
                            'server': server,
                            'index': index,
                            'data': hostState
                        }
                    }))
                }
            })
        }
    }
}

//Check to see if all hosts are up and all services are running.
function operationalCheck(server) {
    console.log("Checking operational for", server)
    let test = true
    for (var host of ServerList[server].Hosts) {
        if (!host.Online) {
            test = false
        }
    }
    if (ServerList[server].Services.length > 0) {
        for (var service of ServerList[server].Services) {
            if (!service.Running) {
                test = false
            }
        }
    }
    //Only update the ServerList object if a change has been made.  Update all WebSocket clients.
    if (!_.isEqual(ServerList[server].Operational, test)) {
        ServerList[server].Operational = test
        console.log("Operational", test)
        wss.clients.forEach(function each(client) {
            if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify({
                    'action': 'UPDATE_DATA_OPERATIONAL',
                    'data': {
                        'server': server,
                        'data': test
                    }
                }))
            }
        })
    }
}

wss.on('connection', function open(ws) {
    console.log('Client Connected');
})

wss.on('close', function close() {
    console.log('disconnected');
})

//Retrieves the ServerList object.
app.get('/api/servers', (req, res) => {
    res.json(ServerList)
    res.end
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
    res.end
})

server.listen(8888, () => {
    console.log("App listening.")
})
