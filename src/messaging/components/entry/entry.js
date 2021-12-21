// COMPONENTS

function Entry(entry) {
  return {
    // --> DATA <--

    type: entry.type,
    message: entry.type === "message" ? entry : null,
    separator: entry.type === "separator" ? entry : null
  }
}

// EXPORTS

export default Entry
