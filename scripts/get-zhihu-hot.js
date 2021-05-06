const ZhihuHotURL = 'https://www.zhihu.com/billboard';
const hotItemRegex = /"target".*?"titleArea".*?"text":"(.*?)".*?"link":.*?"url":"(.*?)"/gs;

async function getZhihuHot() {
    const { error, data: hotHtml } = await $http.get({ url: ZhihuHotURL });
    if (error) {
        throw error;
    }
    if (!hotHtml || typeof hotHtml !== 'string') {
        throw new Error(`No readable data from ${ZhihuHotURL}`);
    }
    return [...hotHtml.matchAll(hotItemRegex)].map((item) => ({
        title: item[1],
        link: item[2],
    }));
}

module.exports = getZhihuHot;
