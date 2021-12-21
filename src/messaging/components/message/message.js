// CONSTANTS

const INVALID_FALLBACK = "(?)"
const LINE_BREAK_REGEX = /\n/g;
const SPACE_REGEX = /\s/g;
const DATE_FORMAT_LOCATION = "en-US";

// COMPONENTS

function Message(message) {
  return {
    // --> DATA <--

    user: message.user,
    date: null,
    lines: null,

    // --> METHODS <--

    mounted() {
      // Generate message lines HTML (based on type)
      this.lines = this.generateLines(message.content)

      // Generate message date text
      this.date = this.generateDate(message.date)
    },

    generateLines(contents) {
      return contents.map((content) => {
        switch (content.type) {
          case "text": {
            // Generate lines
            return content.text.replace(LINE_BREAK_REGEX, "<br>")
          }

          default: {
            // Type is invalid
            return INVALID_FALLBACK
          }
        }
      })
    },

    generateDate(dateString) {
      let date = new Date(dateString)

      // Date is valid?
      if (isNaN(date.getTime()) === false) {
        let timeString = date.toLocaleString(DATE_FORMAT_LOCATION, {
          hour: "numeric",
          minute: "numeric",
          hour12: true
        })

        return timeString.toLowerCase().replace(SPACE_REGEX, "")
      }

      // Date is invalid
      return INVALID_FALLBACK
    }
  }
}

// EXPORTS

export default Message
