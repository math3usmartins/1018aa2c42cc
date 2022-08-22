const pooledDownload = async (connect, save, downloadList, maxConcurrency) => {
    let capacityReached = false;
    let connections = await Promise.all(
        [...Array(maxConcurrency).keys()].map(
            async () => {
                if (capacityReached) {
                    return Promise.resolve(null);
                }

                const connection = await connect();

                if (!connection) {
                    capacityReached = true;
                    return null;
                }

                return connection;
            }
        )
    );

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
