import React from "react"
import ReactDOM from "react-dom"
import { App } from "./components/App"

// Render the app.
const root = document.createElement("div")
document.body.appendChild(root)

ReactDOM.render(<App />, root)
