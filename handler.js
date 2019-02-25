'use strict'

module.exports.ref = (event, context, callback) => {
  const url = 'https://www.bwo.admin.ch/bwo/fr/home/mietrecht/referenzzinssatz.html'
  /** @var fetch Promise */
  const fetch = require('node-fetch')
  const xpath = require('xpath')
  const DOMParser = require('xmldom').DOMParser

  fetch(url)
    .then(res => res.text())
    .then(text => new DOMParser().parseFromString(text))
    .then(function (doc) {
      return {
        value: xpath.select('//*[@id="content"]/div/div[1]/div[5]/h2', doc),
        validity: xpath.select('//*[@id="content"]/div/div[1]/div[6]/article/p', doc)
      }
    })
    .then(function (obj) {
      obj.value = obj.value[0].firstChild.data
      obj.validity = obj.validity[0].textContent
      return obj
    })
    .then(function (obj) {
      obj.value = obj.value.split(':')[1].trim().replace('%', '').replace(',', '.')
      obj.value = parseFloat(obj.value) / 100
      const matches = obj.validity.match(/[0-9.]+/g)
      let parseDate = function (d) {
        if (!d) return null
        let from = d.split('.')
        return new Date(from[2], from[1] - 1, from[0])
      }
      obj.validity = parseDate(matches[0]) || null
      obj.lastUpdate = parseDate(matches[1]) || null
      return obj
    })
    .then(obj => callback(null, {
        statusCode: 200,
        body: JSON.stringify(obj)
      })
    )
    .catch(function(error){
      const debug = event.queryStringParameters != null && event.queryStringParameters.hasOwnProperty('debug') && event.queryStringParameters.debug === '1'
      let response = {error: error.message}
      if(debug){
        response.stack = error.stack
      }
      callback(null, {
        statusCode: 500,
        body: JSON.stringify(response)
      })
    })
}
