// Dependecies

const axios = require('axios')
const pMap = require('p-map')

let Compo = require('../../../component')

// Component Method

let main = {
    async wiki (query, lang) {
        return axios.get(`https://${lang}.wikipedia.org/w/api.php`, {
            params: {
                format: "json",
                action: "opensearch",
                prop: "extracts",
                exintro: true,
                explaintext: true,
                search: query,
                limit: 5
            }
        }).then(res => {
            if (res.data instanceof Array && res.data.length === 4 && res.data[0] === query &&
                res.data[1] instanceof Array && res.data[1].length > 0 && 
                res.data[3] instanceof Array && res.data[3].length === res.data[1].length) {
                let entries = new Array()
                for (var i = 0; i < res.data[1].length; i++) {
                    entries.push({
                        title: res.data[1][i],
                        url: res.data[3][i],
                    })
                }
                return entries
            } else {
                return undefined
            }
        }).then(async entries => {
            if (entries !== undefined) {
                const mapper = async entry => {
                    const resp = await axios.get(`https://${lang}.wikipedia.org/w/api.php`, {
                        params: {
                            format: "json",
                            action: "query",
                            prop: "extracts",
                            exintro: true,
                            explaintext: true,
                            redirects: 1,
                            titles: entry.title
                        }
                    })
                    if (resp.data.hasOwnProperty("query")) {
                        let pages = resp.data.query.pages
                        if (!pages.hasOwnProperty("-1")) {
                            let pageNum = Object.keys(pages).map(item => item.match(/\d+/)).pop()
                            return {
                                lang: lang,
                                title: pages[pageNum].title,
                                caption: pages[pageNum].extract.slice(0, 25) + "...",
                                content: `*${pages[pageNum].title}* [@Wikipedia](https://${lang}.wikipedia.org/wiki/${query})` + "\n" + pages[pageNum].extract,
                                url: entry.url
                            }
                        }
                    }
                    return undefined
                }
                let result = await pMap(entries, mapper, {concurrency: 4})
                return result.filter(elt => elt !== undefined)
            } else {
                return undefined
            }
        }).catch(err => {
            return err
        })
    }
}

// Inner

exports.commands = {
    async main () {

    }
}

exports.inlines = {
    async main (ctx) {
        let globalPattern = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/gumi
        if (!globalPattern.test(ctx.inlineQuery.query) && ctx.inlineQuery.query != "") {
            Compo.Interface.Log.Log.info(`${ctx.from.first_name} 发起了 Wikipedia 查询 ${ctx.inlineQuery.query}`)
            let data = await main.wiki(ctx.inlineQuery.query, "zh").catch(err => {
                this.DiagnosticLog.fatal(err)
                return undefined
            })
            if (data instanceof Error) {
                this.DiagnosticLog.fatal(err)
                return undefined
            }
            else if (data != undefined) {
                return data.map(entry => {
                    return {
                        type: "article",
                        id: ctx.inlineQuery.id,
                        title: `${entry.title}`,
                        description: entry.caption,
                        thumb_url: "https://i.loli.net/2019/11/06/Om7oWzkAMRZl5sc.jpg",
                        input_message_content: { message_text: `${entry.content}`, parse_mode: "Markdown" },
                        reply_markup: {
                            inline_keyboard: [[
                                {
                                    text: "Wikipedia Page",
                                    url: `${entry.url}`,
                                }
                            ]]
                        }
                    }
                })
            }
            else {
                data = await main.wiki(ctx.inlineQuery.query, "en")
                if (data != undefined) {
                    return data.map(entry => {
                        return {
                            type: "article",
                            id: ctx.inlineQuery.id,
                            title: `${entry.title}`,
                            description: entry.caption,
                            thumb_url: "https://i.loli.net/2019/11/06/Om7oWzkAMRZl5sc.jpg",
                            input_message_content: { message_text: `${entry.content}`, parse_mode: "Markdown" },
                            reply_markup: {
                                inline_keyboard: [[
                                    {
                                        text: "Wikipedia Page",
                                        url: `${entry.url}`,
                                    }
                                ]]
                            }
                        }
                    })
                }
            }
            return undefined
        }
        return undefined
    }
}

exports.messages = {
    async main (ctx) {

    }
}

exports.callbackQuery = {
    async main () {

    }
}

// Register

exports.register = {
    // As the example to Yawarakai Compos
    commands: [
        // {
        //     // function: 'main'
        // }
    ],
    inlines: [
        {
            function: "main"
        }
    ],
    messages: [
        // {
        //     // function: 'main'
        // }
    ],
    callbackQuery: [
        // {
        //     function: 'main'
        // }
    ]
}