const makeCheckServices = wmiQuery => server => {
    const queryParameters = {
        "class": 'Win32_Service',
        "host": server || '',
        "properties": ['DisplayName', 'Name', 'State', 'Started']
    }
    return wmiQuery(queryParameters)
}

module.exports = makeCheckServices