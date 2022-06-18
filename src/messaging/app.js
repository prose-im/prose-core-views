/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { createApp } from "petite-vue"
import Avatar from "./components/avatar/avatar.js"
import Separator from "./components/separator/separator.js"
import Message from "./components/message/message.js"
import Entry from "./components/entry/entry.js"

// FIXTURES

const fixtures =
  process.env.NODE_ENV === "development"
    ? require("../../res/fixtures/messaging.json")
    : null;

// COMPONENTS

function App() {
  return {}
}

// DATA

const feed = fixtures !== null ? fixtures.feed : []

// INITIALIZERS

createApp({
  App,
  Avatar,
  Separator,
  Message,
  Entry,
  feed
}).mount("#app")
