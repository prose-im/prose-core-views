// CONSTANTS

const LINE_BREAK_REGEX = /\n/g;

// COMPONENTS

function Message(message) {
  return {
    // --> DATA <--

    date: message.date,
    user: message.user,
    lines: null,

    // --> METHODS <--

    mounted() {
      this.lines = message.content.map((content) => {
        // Generate message HTML (based on type)
        switch (content.type) {
          case "text": {
            return content.text.replace(LINE_BREAK_REGEX, "<br>")
          }

          default: {
            return "(?)"
          }
        }
      })
    }
  }
}

// EXPORTS

export default Message
