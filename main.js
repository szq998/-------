const getZhihuHot = require('./scripts/get-zhihu-hot');
const doWithTimeout = require('./scripts/do-with-timeout');

const ITEM_FONT_SIZE = 13;
const ITEM_PADDING = 3;
const ITEM_HEIGHT = ITEM_FONT_SIZE * 2 + ITEM_PADDING * 2;

const BG_CONTENT_OPACITY_LIGHT = 0.08;
const BG_CONTENT_OPACITY_DARK = 0.15;

const OPEN_IN_SAFARI = $widget.inputValue === 'open-in-safari';

(async function () {
    let items = null;
    let date = null;
    try {
        items = await doWithTimeout(getZhihuHot, 10000);
        date = new Date();
        $cache.setAsync({
            key: 'data',
            value: { items, date },
        });
    } catch (e) {
        console.log(e);

        const cached = await $cache.getAsync('data');
        if (cached && cached.items && cached.date) {
            ({ items, date } = cached);
        }
    }

    const entry = {
        info: items,
        date,
    };
    $widget.setTimeline({
        entries: [entry],
        policy: { atEnd: true },
        render: (ctx) => {
            const {
                entry: { info: items, date },
                displaySize,
                family,
            } = ctx;

            if (!Array.isArray(items)) {
                return {
                    type: 'zstack',
                    views: [
                        renderBackground(ctx),
                        {
                            type: 'text',
                            props: { text: '加载中...', font: $font(35) },
                        },
                    ],
                };
            }

            const itemPerColumn = Math.floor(
                (displaySize.height - 10) / ITEM_HEIGHT
            );
            const numColumn = family === 0 ? 1 : 2;
            const link = 'https://www.zhihu.com/billboard';
            return {
                type: 'zstack',
                props: {
                    widgetURL: OPEN_IN_SAFARI
                        ? link
                        : getLinkOpenedInJSBox(link),
                },
                views: [
                    renderBackground(ctx),
                    renderUpdatingTime(date, ctx),
                    renderHotNews(items, itemPerColumn, numColumn),
                ],
            };
        },
    });
})();

function renderBackgroundGradient() {
    return {
        type: 'gradient',
        props: {
            startPoint: $point(0, 0),
            endPoint: $point(0, 1),
            colors: [
                $color('#88E3F8', '#2F6C8C'),
                $color('#58BFF5', '#1941A3'),
            ],
        },
    };
}

function renderBackgroundPlatformLogo({ family, isDarkMode }) {
    // $widget接口获取的isDarkMode始终为false，获取的family有效，但在JSBox内预览时无效
    const size = family === 0 ? 30 : family === 1 ? 40 : 50;
    const opacity = isDarkMode
        ? BG_CONTENT_OPACITY_DARK
        : BG_CONTENT_OPACITY_LIGHT;
    // 深色模式动态图片无效
    const image = isDarkMode
        ? $image('assets/icon-light.png')
        : $image('assets/icon-dark.png');
    return {
        type: 'image',
        props: {
            opacity,
            image,
            resizable: true,
            frame: {
                width: size,
                height: size,
            },
            padding: 10,
        },
    };
}

function renderBackground(ctx) {
    return {
        type: 'zstack',
        props: {
            alignment: $widget.alignment.bottomTrailing,
        },
        views: [renderBackgroundGradient(), renderBackgroundPlatformLogo(ctx)],
    };
}

function renderUpdatingTime(date, { family, isDarkMode }) {
    const opacity = isDarkMode
        ? BG_CONTENT_OPACITY_DARK
        : BG_CONTENT_OPACITY_LIGHT;
    const fontSize = family === 0 ? 45 : family === 1 ? 70 : 90;
    return {
        type: 'vstack',
        views: [
            {
                type: 'text',
                props: {
                    text: '更新于',
                    opacity,
                },
            },
            {
                type: 'text',
                props: {
                    text:
                        String(date.getHours()).padStart(2, '0') +
                        ':' +
                        String(date.getMinutes()).padStart(2, '0'),
                    font: $font('bold', fontSize),
                    opacity,
                },
            },
        ],
    };
}

function renderHotNews(items, itemPerColumn, numColumn) {
    const space = {
        type: 'spacer',
        props: { frame: { width: 10 } },
    };
    return {
        type: 'hstack',
        views: [
            space,
            ...[...Array(numColumn)].map((_, i) =>
                renderColumn(
                    items.slice(i * itemPerColumn, (i + 1) * itemPerColumn)
                )
            ),
            space,
        ],
    };
}

function renderColumn(items) {
    return {
        type: 'vstack',
        props: {
            spacing: 0, // 0 spacing，通过增大item的height来分隔，以增大点触面积
        },
        views: items.map(renderItem),
    };
}

function renderItem(item) {
    const { title, link } = item;
    return {
        type: 'text',
        props: {
            link: OPEN_IN_SAFARI ? link : getLinkOpenedInJSBox(link),
            text: title,
            font: $font(ITEM_FONT_SIZE),
            color: $color('#444', '#eee'),
            lineLimit: 2,
            frame: {
                maxWidth: Infinity,
                height: ITEM_HEIGHT,
                alignment: $widget.alignment.leading,
            },
            minimumScaleFactor: 0.8,
        },
    };
}

function getLinkOpenedInJSBox(url) {
    const script = `$safari.open('${url}')`;
    return `jsbox://run?script=${encodeURIComponent(script)}`;
}
