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

    const chunks = [];
    const chunkSize = Math.floor(downloadList.length / connections.length);
    for (let s=0; s<connections.length; s++) {
        const start = s * chunkSize;
        chunks.push(
            downloadList.slice(start, start + chunkSize)
        );
    }

    return await Promise.all(
        connections.map(
            (connection, c) => executePool(connection, save, chunks[c])
        )
    ).finally(
        () => {
            connections.forEach(
                connection => {
                    const {_, close} = connection;
                    close();
                }
            )
        }
    );
}

async function executePool(connection, save, downloadList) {
    const {download, _} = connection;
    let result;

    while (downloadList.length > 0) {
        const itemToDownload = downloadList.shift();
        result = await download(itemToDownload);
        await save(result);
    }

    return result;
}

module.exports = pooledDownload
