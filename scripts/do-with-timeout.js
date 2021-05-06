function doWithTimeout(asyncJob, maxTime, ...args) {
    return new Promise((resolve, reject) => {
        setTimeout(reject, maxTime);
        asyncJob(...args).then(resolve, reject);
    });
}

module.exports = doWithTimeout;
