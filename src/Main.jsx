import React, { useState, useEffect } from "react";

import voiceInputIcon from "./voice.png";
import "./Main.css";
const apiKey = process.env.GPT_KEY;
function Chatbot() {
  const [userInput, setUserInput] = useState("");
  const url = `https://api.openai.com/v1/chat/completions`;
  const speakurl = "https://api.openai.com/v1/audio/speech";
  const [chatHistory, setChatHistory] = useState([
    `Role: Sales Agent at Amberstudent.com, a marketplace for student accommodations.
    Objective: Follow up on a lead from a student interested in accommodations in the UK, US, or AUS.
    Interaction Guidelines:
    Start with a polite greeting.
    Listen attentively and patiently. If clarification is needed, politely request the lead to repeat their information.
    Speak naturally, using pauses and filler words ("Hmm," "Okay," "Noted," "I see") to ensure the conversation sounds conversational and not robotic.
    Information Gathering:
    Ask for confirmation of the student's destination and university without assuming prior knowledge.
    Inquire about the student's budget preferences, specifying whether they are considering weekly or monthly expenses.
    Request information about the desired duration of stay.
    Invite the student to specify any particular accommodation requirements they have.
    Handling Uncertainties:
    If unable to answer a query immediately, apologize, assure the lead that you will consult with your team, and commit to following up with a solution.
    
    Make sure your messages don't exceed 50 words and make sure to go question by question. 

    If you get unexpected response, instead of saying ' small typing error', please say 'small misunderstanding'
    Computer is you and User is me.`,
  ]);

  const handleChange = (event) => {
    // setUserInput(event.target.value);
  };

  const handleSubmit = async (transcript) => {
    console.log("userInput", transcript);
    const userInputWithPrefix = "User: " + transcript;
    const updatedHistory = [...chatHistory, userInputWithPrefix];
    setChatHistory(updatedHistory);

    const response = await callGemini(updatedHistory);

    const responseWithPrefix = "Computer: " + response;
    setChatHistory([...updatedHistory, responseWithPrefix]);

    setUserInput("");
    console.log("CHAT HISTORY ", chatHistory);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript; // Get the transcript of the speech
      console.log("setUserInput", transcript);
      setUserInput(transcript); // Set the transcript as the user input
      handleSubmit(transcript);
    };

    recognition.onend = () => {
      setTimeout(() => {
        // handleSubmit();
      }, 2000);
    };

    recognition.start();
  };

  async function callGemini(chatHistory) {
    const data = {
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `${chatHistory}}`,
        },
        {
          role: "user",
          content: `${userInput}}`,
        },
      ],
      temperature: 1,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    });

    const json = await response.json();

    if (json.choices && json.choices.length > 0 && json.choices[0].message) {
      speak(json.choices[0].message.content);
      return json.choices[0].message.content;
    } else {
      console.error("Unexpected response from API:", json);
      return "Sorry, I couldn't understand that.";
    }
  }

  useEffect(() => {
    const initiateConversation = async () => {
      const response = await callGemini(chatHistory);
      const responseWithPrefix = "Computer: " + response;
      setChatHistory([...chatHistory, responseWithPrefix]);

      //   speak(response);
      //   speak("Hello what's up?");
      setTimeout(() => {
        console.log("speaking response", response);
      }, 3000);
    };

    initiateConversation();

    window.onbeforeunload = () => {
      const synth = window.speechSynthesis;
      synth.cancel();
    };

    return () => {
      // Cleanup: remove the event listener
      window.onbeforeunload = null;
    };
  }, []);

  const speak = async (text) => {
    const speakdata = {
      model: "tts-1",
      input: `${text}`,
      voice: "alloy",
    };

    try {
      const response = await fetch(speakurl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(speakdata),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.statusText}`);
      }

      const audioData = await response.blob();
      const audioUrl = URL.createObjectURL(audioData);

      const audioElement = new Audio(audioUrl);
      audioElement
        .play()
        .catch((error) => console.error("Failed to play audio:", error));
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="chat-container">
      <ul>
        {chatHistory.map(
          (message, index) =>
            index !== 0 && ( // Check if index is not 0
              <li
                key={index}
                className={message.user ? "user-message" : "bot-message"}
                style={{
                  listStyleType: "none",
                  borderBottom: "1px solid black",
                }}
              >
                {message}
              </li>
            )
        )}
      </ul>
      <div className="chat-input">
        <input type="text" value={userInput} onChange={handleChange} />
        {/* <button onClick={handleSubmit}>Send</button> */}
        <button
          onClick={handleVoiceInput}
          style={{
            borderRadius: "50%",
            padding: "10px",
            background: "none",
            border: "none",
          }}
        >
          <img src={voiceInputIcon} alt="Voice Input" />{" "}
          {/* Replace 'voice-input.png' with your actual file name */}
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
