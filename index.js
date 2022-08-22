const pooledDownload = async (connect, save, downloadList, maxConcurrency) => {
    let capacityReached = false;
    const connections = [];

    for (let c=0; c<maxConcurrency; c++) {
        if (capacityReached) {
            break;
        }

        await connect()
            .then(connection => connections.push(connection))
            .catch(() => {
                capacityReached = true;
            });
    }

    if (connections.length === 0) {
        return Promise.reject({
            message: 'connection failed'}
        );
    }

    return await Promise.all(
        connections.map(
            connection => executePool(connection, save, downloadList)
        )
    )
}

async function executePool(connection, save, downloadList) {
    const {download, close} = connection;
    let result;

    while (downloadList.length > 0) {
        const itemToDownload = downloadList.shift();
        result = await download(itemToDownload);
        await save(result);
    }

    close();

    return result;
}

module.exports = pooledDownload
