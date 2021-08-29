const rewire = require("rewire")
const index = rewire("./index")
const checkServers = index.__get__("checkServers")
const hostOnline = index.__get__("hostOnline")
const operationalCheck = index.__get__("operationalCheck")
// @ponicode
describe("checkServers", () => {
    test("0", async () => {
        await checkServers()
    })
})

// @ponicode
describe("hostOnline", () => {
    test("0", async () => {
        await hostOnline(0.5, ["smtp-relay.sendinblue.com", "smtp.gmail.com"])
    })

    test("1", async () => {
        await hostOnline(0.0, ["smtp-relay.sendinblue.com", "smtp.gmail.com"])
    })

    test("2", async () => {
        await hostOnline(-29.45, ["smtp-relay.sendinblue.com", "smtp.gmail.com"])
    })

    test("3", async () => {
        await hostOnline(0.0, "mongo")
    })

    test("4", async () => {
        await hostOnline(-1.0, ["smtp-relay.sendinblue.com", "smtp.gmail.com"])
    })

    test("5", async () => {
        await hostOnline(undefined, undefined)
    })
})

// @ponicode
describe("operationalCheck", () => {
    test("0", () => {
        let callFunction = () => {
            operationalCheck(-1.0)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            operationalCheck(0.0)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            operationalCheck(10.23)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            operationalCheck(0.5)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            operationalCheck(1.0)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            operationalCheck(NaN)
        }
    
        expect(callFunction).not.toThrow()
    })
})
