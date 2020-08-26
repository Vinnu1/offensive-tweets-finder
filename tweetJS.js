// Imports the Google Cloud Translation library
const { TranslationServiceClient } = require('@google-cloud/translate');

//Your JSON file containing tweet data
const tweets = require('./tweet.json')
const sentiment = new (require('sentiment'))()

// Edit your project details
const keyFilename = 'path_to_filekey.json'
const projectId = 'your_project_id';
const location = 'global';
const modelId = 'general/base'

// Instantiates a client
const translationClient = new TranslationServiceClient({ projectId, keyFilename });
async function translateText(text) {
    // Construct request
    const request = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: [text],
        mimeType: 'text/plain',
        sourceLanguageCode: 'hi',
        targetLanguageCode: 'en',
        model: `projects/${projectId}/locations/${location}/models/${modelId}`
    }

    try {
        const [response] = await translationClient.translateText(request);
        return (response.translations[0].translatedText)
    } catch (error) {
        console.error('error:', error.details);
    }
}

async function processAll() {

    const infoArr = tweets.map(async (obj) => {
        let info = {}
        let tweet = obj.tweet
        let lang = tweet.lang
        let text = tweet.full_text

        //translate tweet if it is in 'hindi' language
        if (lang == "hi") {
            text = await translateText(text)
        }
        else if (lang == "und") {
            return {}
        }

        let analyzedText = sentiment.analyze(text)
        info.url = `https://twitter.com/your_twitter_username/status/${tweet.id}}`
        info.tweet = text
        info.score = analyzedText.comparative
        info.words = analyzedText.calculation.map((wordObj) => {
            let key = Object.keys(wordObj)[0]
            return `${key} : ${wordObj[key]}`
        })
        return info
    })

    let newArr = await Promise.all(infoArr)
    negTweets(newArr)
}
processAll()

function negTweets(arr) {
    //sort in ascending order
    sortedArr = arr.sort((a, b) => a.score - b.score)

    //print arr containing first 5 tweets/elements
    console.log(sortedArr.slice(0, 5))
}