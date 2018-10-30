const makeCheckServices = require('.')

describe('check-services', () => {
    let checkServices
    let wmiQuery
    beforeEach(() => {
        wmiQuery = jest.fn()
        checkServices = makeCheckServices(wmiQuery)
    })

    test('can be called', () => {
        checkServices()
    })

    test('calls wmiQuery with correct properties', () => {
        checkServices("test-server")
        expect(wmiQuery).toBeCalledWith({
            "class": 'Win32_Service',
            "host": "test-server",
            "properties": ['DisplayName', 'Name', 'State', 'Started']
        })
    })

    test('calls wmiQuery with localhost if no server specified', () => {
        checkServices()
        expect(wmiQuery).toBeCalledWith({
            "class": 'Win32_Service',
            "host": '',
            "properties": ['DisplayName', 'Name', 'State', 'Started']
        })
    })

    test('returns a promise', () => {
        let fakePromise = {}
        wmiQuery.mockReturnValue(fakePromise)
        let service = checkServices('')
        expect(service).toBe(fakePromise)
    })
})
