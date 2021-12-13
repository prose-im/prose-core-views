// IMPORTS

import { createApp } from "petite-vue";

// COMPONENTS

function App(props) {
  return {
    // --> SETUP <--

    $template : "#counter-template",

    // --> STATE <--

    count : props.initialCount,

    // --> METHODS <--

    increment() {
      this.count++
    }
  }
}

// INITIALIZERS

createApp({ App }).mount("#app");
