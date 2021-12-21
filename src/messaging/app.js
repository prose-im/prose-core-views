// IMPORTS

import { createApp } from "petite-vue";
import Avatar from "./components/avatar/avatar.js";
import Separator from "./components/separator/separator.js";
import Message from "./components/message/message.js";
import Entry from "./components/entry/entry.js";

// COMPONENTS

function App() {
  return {}
}

// DATA

var feed = [
  {
    type: "separator",
    label: "Monday"
  },

  {
    type: "message",
    date: "2021-12-20T19:15:03.000Z",

    content: [
      {
        type: "text",
        text: "Quick message just to confirm that I asked the designers for a new illustration.\n\nWe need one more for the blog.\n\nMight be done tomorrow 😀"
      }
    ],

    user: {
      name: "Valerian",
      avatar: "https://gravatar.com/avatar/b4cb8302ee37f985cc76190aaae1b40b?size=80"
    }
  },

  {
    type: "separator",
    label: "Yesterday"
  },

  {
    type: "message",
    date: "2021-12-21T09:03:07.832Z",

    content: [
      {
        type: "text",
        text: "They forgot to ship the package."
      },

      {
        type: "text",
        text: "But that is no problem, I will go pick it up this afternoon!"
      }
    ],

    user: {
      name: "Baptiste",
      avatar: "https://gravatar.com/avatar/5603c33823b047149d9996a1be53afd4?size=80"
    }
  }
]

// INITIALIZERS

createApp({
  App,
  Avatar,
  Separator,
  Message,
  Entry,
  feed
}).mount("#app");
