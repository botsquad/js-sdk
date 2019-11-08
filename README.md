# Botsquad Typescript SDK


## ChatBubble API

Purpose:

 - Get information about the chat bubble (bot details, unread message count)
 - Keep unread message count updated in realtime
 - Ability to send 'page view' events to indicate on which page the bubble is being displayed
 - Configure an app push token
 - Handle in-app nudges and allow the user to engage with these.

Example code:

```javascript
import { ChatBubble } from '@botsquad/sdk'

const config = {
  // required:
  botId: '66a8fe768ea6fea876f987ea',
  userAgent: 'testApp/1.0 (Android; 8)',

  // optional:
  locale: 'nl_NL',
  timezone: 'Europe/Amsterdam',
  userToken: '<userToken that was sent on the previous connect()>',
  hostname: 'bsqd.me',
  context: {
    any: 'value'
  }
}

const bubble = new ChatBubble(config)

// initiate the connection.
const info = await bubble.connect()

// information that is returned:
const {
  userToken,
  badgeCount,
  bot: {
    id, title, profilePicture
  },
  context: {
    any: 'value'
  }
} = info

console.log(`Connected with user token: ${userToken}`)

bubble.on('badgeCountUpdate', badgeCount => {
  console.log('Got new badge count: ' + badgeCount)
})

// page change
bubble.sendPageView('http://pageurl.com', 'page title')

// nudges
bubble.on('nudge', nudge => {
  const {
    message, profilePicture, caption
  } = nudge

  // show the nudge
  if (caption) {
    // show nudge with title bar and (optionally) a picture
  } else {
    // show basic message-only nudge
  }
})

// dismiss the nudge
bubble.nudgeDismiss(nudge)

// engage with the nudge
await bubble.nudgeEngage(nudge)

```

Still to implement:

```
// configure push token
bubble.configurePushToken('pushwoosh', '<token data>')

// get the URL for the chat
bubble.getWebviewUrl()

// get the URL for the chat when clicking on a nudge
bubble.getWebviewUrl(nudge)
```
