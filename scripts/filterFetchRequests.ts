/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { readFileSync, writeFileSync } from 'fs'

const harFile = readFileSync('./jestorRequests.har', 'utf8')

const har = JSON.parse(harFile)

const filteredHar = har.log.entries.filter((entry: any) => {
  return (
    entry.request.url.includes('api.jestor') &&
    entry.request.method !== 'OPTIONS'
  )
})

const normalizedValues = filteredHar.map((entry: any) => {
  const { request, response, time, startedDateTime } = entry

  let payload = request.postData?.params[0].value

  try {
    payload = payload && JSON.parse(payload)

    if (payload.token) {
      payload.token = undefined
    }
  } catch (error) {
    payload = undefined
    console.log('error', payload)
  }

  let reqRes = response.content.text
  reqRes = reqRes && JSON.parse(reqRes)

  const urlObject = new URL(request.url)

  return {
    request: {
      method: request.method,
      path: urlObject.pathname + urlObject.search,
      payload,
    },
    response: {
      status: response.status,
      body: reqRes?.data,
    },
    stats: {
      time,
      startTime: new Date(startedDateTime).getTime(),
    },
    metadata: reqRes?.metadata,
  }
})

writeFileSync(
  './src/mocks/mockedRequests.json',
  JSON.stringify(normalizedValues, null, 2),
)
