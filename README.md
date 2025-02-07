# prose-core-views

[![Test and Build](https://github.com/prose-im/prose-core-views/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/prose-im/prose-core-views/actions/workflows/test.yml) [![Build and Release](https://github.com/prose-im/prose-core-views/actions/workflows/build.yml/badge.svg)](https://github.com/prose-im/prose-core-views/actions/workflows/build.yml) [![GitHub Release](https://img.shields.io/github/v/release/prose-im/prose-core-views.svg)](https://github.com/prose-im/prose-core-views/releases) [![NPM](https://img.shields.io/npm/v/@prose-im/prose-core-views.svg)](https://www.npmjs.com/package/@prose-im/prose-core-views)

**Prose core views. Shared messaging views across all platforms.**

As Prose is a native cross-platform application, some views that are deemed too complex to build natively are shared between all apps. Those views are rendered in a lightweight and minimal Web view, and shared between mobile and desktop platforms. This also ensures that the Prose user experience stays consistent between all platforms.

Prose views are built on [`petite-vue`](https://github.com/vuejs/petite-vue), which is a super-lightweight minimal version of VueJS. This ensures that the rendering of elements such as lists stays efficient, usually even more efficient than using barebone native views. All assets get bundled using [`parcel`](https://parceljs.org/), which helps at easing development and produces an optimized production build.

Copyright 2022, Prose Foundation - Released under the [Mozilla Public License 2.0](./LICENSE.md).

_Tested at NodeJS version: `v20.7.0`_

## Preview

### Messaging view

![message](https://user-images.githubusercontent.com/1451907/174491797-e6e75017-d9ca-4b6e-a3b7-d910292e3a09.png)

_👉 The designs for all of the views are contained in the macOS app reference design [which can be found there](https://github.com/prose-im/prose-medley/blob/master/designs/app/prose-app-macos.sketch)._

## Installation

To install all the build dependencies, you first need to install NodeJS (version `12` and above).

Then, hit:

```
npm install
```

A pre-built package is also available:

```
npm add @prose-im/prose-core-views
```

## Build

Building the Prose core views is done per-target environment. Please check below for build instructions based on your target environment.

### Production target

To build Prose for a production environment (that is, usage within an actual Prose app), hit:

```
npm run build
```

### Development target

To build Prose for a development environment (that is, usage from a browser, while making changes), hit:

```
npm run dev
```

Then, open a Web browser and go to: [localhost:5000](http://localhost:5000/). Any saved changes will be hot-reloaded, meaning you will get live previews.

## Usage

Once built, all assets in `dist/` should be packaged within the Prose native app, and included in a Web view where relevant.

Serialized data should be passed to the view whenever its model needs to be updated.

### Messaging view

The messaging view can be included from path: `./dist/messaging.html`

#### 1. Pushing messages to the store

The messaging view exposes a programmatic API that lets applications manipulate its internal store:

- Check if a message exists: `MessagingStore.exists(messageId<string>)<boolean>`
- Resolve a message from the store: `MessagingStore.resolve(messageId<string>)<null | object>`
- Restore one or multiple past messages in the store (ie. prepend): `MessagingStore.restore(...messages<object>)<boolean>`
- Insert one or multiple messages in the store (ie. append): `MessagingStore.insert(...messages<object>)<boolean>`
- Update a message in the store: `MessagingStore.update(messageId<string>, messageDiff<object>)<boolean>`
- Pull out a message from the store: `MessagingStore.retract(messageId<string>)<boolean>`
- Flush all content from the store: `MessagingStore.flush()<boolean>`
- Highlight a message in the store: `MessagingStore.highlight(messageId<string>)<boolean>`
- Interact with a message action: `MessagingStore.interact(messageId<string>, action<string>, isActive<boolean>)<boolean>`
- Scroll to a message: `MessagingStore.scroll(messageId<string>, isForced<boolean>)<boolean>`
- Toggle `backwards` or `forwards` loader in the store: `MessagingStore.loader(type<string>, isVisible<boolean>)<boolean>`
- Identify an user identifier with its `name` and `avatar`: `MessagingStore.identify(userId<string>, identity<null | object>)<boolean>`

All inserted message objects are required to hold the following keys: `id`, `type`, `date`, `content` and `from`. When updating an existing message, only modified keys need to be passed.

**Text messages are formatted as such:**

```json
{
  "id": "b4d303b1-17c9-4863-81b7-bc5281f3590f",
  "type": "text",
  "date": "2021-12-20T19:15:03.000Z",
  "from": "john.doe@acme.inc",
  "content": "Hello! This is a text message.",

  "metas": {
    "encrypted": true,
    "edited": false,
    "transient": false,
    "lastRead": true
  },

  "reactions": [
    {
      "reaction": "🤠",
      "authors": ["john.doe@acme.inc", "jane.doe@acme.inc"]
    },

    {
      "reaction": "👋",
      "authors": ["jane.doe@acme.inc"]
    }
  ]
}
```

**File attachments (on any message type) are formatted as such:**

```json
{
  "id": "07b4af91-c5f4-45be-98f4-77f554c042c8",
  "type": "text",
  "date": "2021-12-21T09:04:01.000Z",
  "from": "valerian@prose.org",
  "content": "Check this image out!",

  "files": [
    {
      "name": "crisp-keep-calm.jpg",
      "type": "image/jpeg",
      "url": "https://crisp.chat/static/blog/content/images/size/w600/2021/03/12---3-Simple-Actions-to-Tackle-Email-Overload.jpg",

      "size": {
        "width": 1920,
        "height": 1080
      }
    }
  ],

  "metas": {
    "encrypted": false,
    "edited": false,
    "transient": false,
    "lastRead": true
  },

  "reactions": []
}
```

#### 2. Adjusting message view context options

The message view exposes context helpers, that let some options be adjusted at runtime.

As soon as the view is available, the following methods can be called:

**Option getters:**

- Get interface language: `MessagingContext.getLanguage()<string>`
- Get style platform: `MessagingContext.getStylePlatform()<string>`
- Get style renderer: `MessagingContext.getStyleRenderer()<string>`
- Get style theme: `MessagingContext.getStyleTheme()<string>`
- Get style modifier: `MessagingContext.getStyleModifier(name<string>)<object>`
- Get behavior: `MessagingContext.getBehavior(group<string>, option<string>)<object>`
- Get account user identifier: `MessagingContext.getAccountUserId()<string>`

**Option setters:**

- Set interface language: `MessagingContext.setLanguage(code<string>)<undefined>` (where `code` is supported locale code)
- Set style platform: `MessagingContext.setStylePlatform(platform<string>)<undefined>` (where `platform` is any of: `web`, `macos`)
- Set style renderer: `MessagingContext.setStyleRenderer(renderer<string>)<undefined>` (where `renderer` can be eg.: `firefox`, `chrome`, `safari`)
- Set style theme: `MessagingContext.setStyleTheme(theme<string>)<undefined>` (where `theme` is any of: `light`, `dark`)
- Set style modifier: `MessagingContext.setStyleModifier(name<string>, value<object>)<undefined>` (where `name` is any of: `scroll`)
- Set behavior: `MessagingContext.setBehavior(group<string>, option<string>, value<object>)<undefined>` (where `group/option` is any of: `dates/clock24h`, `thumbnails/enable`, `thumbnails/small`)
- Set account user identifier: `MessagingContext.setAccountUserId(userId<string>)<undefined>` (where `userId` is a valid Jabber IDentifier)

#### 3. Subscribing to messaging events

The message view may raise events when certain things happen, such as when the user interacts with a message.

Events can be subscribed to, on per-namespace basis:

- Subscribe to an event namespace: `MessagingEvent.on(namespace<string>, handler<function>)<boolean>`
- Unsubscribe from an event namespace: `MessagingEvent.off(namespace<string>)<boolean>`

The following namespaces are available for use:

- `message:author:identity`: show user identity for a message author (eg. user overs the message avatar or name)
- `message:actions:view`: show the list of actions for a message (eg. user right-clicks on a message)
- `message:reactions:view`: show the list of reactions that can be sent for message
- `message:reactions:authors`: show the list of reaction authors for reaction on message (eg. user overs the reaction)
- `message:reactions:react`: react to a message (eg. user clicks on an existing reaction to send it or retract it)
- `message:file:view`: view a file from a message (eg. user clicks on a file to expand or download the file)
- `message:link:open`: open a link contained in a message (eg. user clicks on a link)
- `message:history:view`: notify when a message from history enters or leaves view area, with the `visible` and `hidden` states (eg. scrolling up or down in the timeline)
- `message:history:seek`: request to load `backwards` or `forwards` history (eg. scrolling back in time to load past messages)

## License

Licensing information can be found in the [LICENSE.md](./LICENSE.md) document.

## :fire: Report A Vulnerability

If you find a vulnerability in any Prose system, you are more than welcome to report it directly to Prose Security by sending an encrypted email to [security@prose.org](mailto:security@prose.org). Do not report vulnerabilities in public GitHub issues, as they may be exploited by malicious people to target production systems running an unpatched version.

**:warning: You must encrypt your email using Prose Security GPG public key: [:key:57A5B260.pub.asc](https://files.prose.org/public/keys/gpg/57A5B260.pub.asc).**
