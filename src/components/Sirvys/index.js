import React, { Component } from "react"
import SocketIOClient from "socket.io-client"
import { database } from "../../firebase/firebase"

import DisplayNums from "../DisplayNums"
import GraphDisplay from "../GraphDisplay"
import SavedSirvys from "../SavedSirvys"
import CurrentNums from "../CurrentNums"
import CurrentSirvy from "../CurrentSirvy"

import { SirvyStyle, SavingStyles } from "./style"

class Sirvys extends Component {
  state = {
    error: "",
    textBody: "",
    currentNumToText: "",
    nameToText: "",
    numbersToText: [],
    returnedTexts: [],
    activeNumbers: [],
    optionA: "",
    optionB: "",
    savedSirvys: [],
    currentSirvy: [],
    sirvyToRender: undefined
  }

  populateBodyOfText = () =>
    this.setState({
      textBody: `Hello MESSAGE RECIPIENT
    ${this.props.currentUser.username} would like to ask you a question:

    Do you prefer

    a) ${this.state.optionA}

    or

    b) ${this.state.optionB}?

    Please reply ONLY with a lowercase a or b.
    Sent from Sirvy-Beautiful SMS Surveys`
    })

  onChange = e => {
    e.persist()
    this.setState({ [e.target.name]: e.target.value }, () => {
      if (e.target.name === "optionA" || e.target.name === "optionB") {
        this.populateBodyOfText()
      }
    })
  }

  sendSirvy = async () => {
    const numbers = this.state.activeNumbers.map(
      recipientNum => `1${recipientNum.number}`
    )
    const names = this.state.activeNumbers.map(names => names.name)

    const message = {
      names: names,
      body: this.state.currentSirvy[0].sirvy,
      to: numbers
    }

    const sending = await fetch(`/send`, {
      method: "POST",
      body: JSON.stringify(message),
      headers: {
        "Content-Type": "application/json"
      }
    })

    const sent = await sending.json()

    this.setState({
      returnedTexts: [],
      sirvyToRender: message.body
        .replace(/\n*/g, "")
        .replace(/.*:/, "")
        .replace(/Pl.*/, "")
        .replace(/ +(?= )/g, "")
        .trim(),
      optionA: "",
      optionB: ""
    })
  }

  saveSirvy = () => {
    database
      .ref(`sirvys/${this.props.currentUser.uid}`)
      .push(this.state.textBody)
      .catch(error => this.setState({ error }))
  }

  addSirvyRecipient = e => {
    const { nameToText, currentNumToText } = this.state
    e.preventDefault()
    if (nameToText && currentNumToText) {
      const sirvyRecipient = {
        name: nameToText,
        number: currentNumToText
      }
      database
        .ref(`numbers/${this.props.currentUser.uid}`)
        .push(sirvyRecipient)
        .catch(error => this.setState({ error }))
      this.setState({
        currentNumToText: "",
        nameToText: "",
        error: ""
      })
    } else {
      this.setState({
        error: "Sirvy Recipient and Phone # Must BOTH Be Entered"
      })
    }
  }

  deleteNumber = key => {
    database.ref(`numbers/${this.props.currentUser.uid}/${key}`).remove()
  }

  deleteSirvy = key => {
    database.ref(`sirvys/${this.props.currentUser.uid}/${key}`).remove()
  }

  addCurrentNum = index => {
    const { activeNumbers, numbersToText } = this.state

    const updatedNums = [...activeNumbers, numbersToText[index]]

    this.setState({
      activeNumbers: [...new Set(updatedNums)]
    })
  }

  removeFromCurrentNum = index => {
    this.setState({
      activeNumbers: this.state.activeNumbers.filter(
        (element, i) => i !== index
      )
    })
  }

  addToCurrentSirvy = index => {
    this.setState({
      currentSirvy: [this.state.savedSirvys[index]]
    })
  }

  removeCurrentSirvy = () => this.setState({ currentSirvy: [] })

  componentDidMount() {
    const { numbersToText, savedSirvys } = this.state

    const socket = SocketIOClient(process.env.REACT_APP_URL)

    socket.on("sms", data => {
      if (this.state.returnedTexts.length < this.state.numbersToText.length) {
        this.state.numbersToText.forEach((obj, i) => {
          if (parseInt(obj.number) === parseInt(data.data.returningNumber)) {
            data.data.name = obj.name
          }
        })

        if (this.state.returnedTexts.length) {
          const checkNumber = num =>
            num.returningNumber !== data.data.returningNumber
          if (this.state.returnedTexts.some(checkNumber)) {
            this.setState({
              returnedTexts: [...this.state.returnedTexts, data.data]
            })
          }
        } else {
          this.setState({
            returnedTexts: [data.data]
          })
        }
      }
    })

    database
      .ref(`numbers/${this.props.currentUser.uid}`)
      .on("value", snapshot => {
        const data = snapshot.val()
        if (data.initialize) {
          delete data.initialize
        }
        const helperArray = []
        for (const num in data) {
          helperArray.push(data[num])
        }
        Object.keys(data).forEach((key, i) => (helperArray[i].key = key))
        this.setState({
          numbersToText: [...numbersToText, ...helperArray]
        })
      })

    database
      .ref(`sirvys/${this.props.currentUser.uid}`)
      .on("value", snapshot => {
        const data = snapshot.val()
        if (data.initialize) {
          delete data.initialize
        }
        const helperArray = []
        for (const sirvy in data) {
          helperArray.push({ sirvy: data[sirvy] })
        }
        Object.keys(data).forEach((key, i) => (helperArray[i].key = key))
        this.setState({
          savedSirvys: [...savedSirvys, ...helperArray]
        })
      })
  }

  render() {
    const {
      currentNumToText,
      returnedTexts,
      numbersToText,
      nameToText,
      error,
      optionA,
      optionB,
      savedSirvys,
      sirvyToRender,
      activeNumbers,
      currentSirvy
    } = this.state
    const { currentUser } = this.props
    return (
      <SirvyStyle>
        {returnedTexts.length >= activeNumbers.length &&
        returnedTexts.length ? (
          <GraphDisplay
            sirvyToRender={sirvyToRender}
            returnedTexts={returnedTexts}
          />
        ) : (
          <form>
            <h2>Your Sirvy will look like this:</h2>
            <p>Hello MESSAGE RECIPIENT</p>
            <p>
              {currentUser.username} would like to ask you a question: do you
              prefer
            </p>
            <span> a)</span>
            <input
              type="text"
              name="optionA"
              value={optionA}
              placeholder="First Option Here"
              onChange={this.onChange}
            />
            <span> or b)</span>
            <input
              type="text"
              name="optionB"
              value={optionB}
              placeholder="Second Option Here"
              onChange={this.onChange}
            />
            <span>?</span>
            <p>Please reply ONLY with a lowercase a or b.</p>
            <p>Sent from Sirvy-Beautiful SMS Surveys</p>
          </form>
        )}
        <form onSubmit={this.addSirvyRecipient}>
          <input
            type="text"
            name="nameToText"
            value={nameToText}
            placeholder="Add Sirvy Recipient"
            onChange={this.onChange}
          />
          <input
            type="text"
            name="currentNumToText"
            value={currentNumToText}
            placeholder="10 Digit #"
            onChange={this.onChange}
          />
          <button type="submit">Save Sirvy Recipient</button>
          <button type="button" onClick={this.saveSirvy}>
            Save Sirvy
          </button>
        </form>
        {error ? <p>{error}</p> : null}
        <SavingStyles>
          <CurrentNums
            activeNumbers={activeNumbers}
            removeFromCurrentNum={this.removeFromCurrentNum}
          />
          <CurrentSirvy
            currentSirvy={currentSirvy}
            sendSirvy={this.sendSirvy}
            removeCurrentSirvy={this.removeCurrentSirvy}
          />
        </SavingStyles>
        <SavingStyles>
          <DisplayNums
            numbersToText={numbersToText}
            deleteNumber={this.deleteNumber}
            addCurrentNum={this.addCurrentNum}
          />
          {savedSirvys ? (
            <SavedSirvys
              savedSirvys={savedSirvys}
              deleteSirvy={this.deleteSirvy}
              addToCurrentSirvy={this.addToCurrentSirvy}
            />
          ) : null}
        </SavingStyles>
      </SirvyStyle>
    )
  }
}

export default Sirvys
