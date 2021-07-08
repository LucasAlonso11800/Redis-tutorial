const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Redis = require('redis');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors());

const redisClient = Redis.createClient();
const DEFAULT_EXPIRATION = 3600;

app.post('/photos', async (req, res) => {
    const albumId = req.body.albumId
    try {
        const photos = await getOrSetCache(`photos?albumId=${albumId}`, fetchData, "https://jsonplaceholder.typicode.com/photos", { params: { albumId } })
        return res.json(photos)
    }
    catch (err) {
        return res.json(err)
    };
});

function getOrSetCache(key, cb, url, params) {
    return new Promise((resolve, reject) => {
        redisClient.get(key, async (err, data) => {
            if (err) return reject(err)
            if (data !== null) return resolve(JSON.parse(data))

            const freshData = await cb(url, params)
            redisClient.setex(key, DEFAULT_EXPIRATION, JSON.stringify(freshData))
            resolve(freshData)
        })
    })
};

async function fetchData(url, params) {
    const { data } = await axios.get(url, params)
    return data
};

app.listen(5000, () => console.log('Listening on 5000'));