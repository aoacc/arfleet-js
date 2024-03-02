console.log("hello from provider/index.js")

const express = require('express')
const app = express()
const port = 3131

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
