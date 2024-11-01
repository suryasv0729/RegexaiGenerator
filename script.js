// import config from "./config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// const API_KEY = config.API_KEY;
const API_KEY = window.prompt("Please enter your API key:");
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const regexInput = document.getElementById("regexInput");
const sampleTextElem = document.getElementById("sampleText");
const generateBtn = document.getElementById("generateBtn");
const regexOutput = document.getElementById("regexOutput");
const matchesOutput = document.getElementById("matchesOutput");
const aiExplanation = document.getElementById("aiExplanation");

if (!API_KEY)
  alert("you didnt provide api key.its necessary for regexie to perform ");

// Initialize CodeMirror
const editor = CodeMirror.fromTextArea(sampleTextElem, {
  lineWrapping: true,
  lineNumbers: true,
  mode: "javascript",
  theme: "default",
});

// Function to highlight matches in the CodeMirror editor
function highlightMatches(regex, sampleText) {
  // Clear previous highlights
  editor.getAllMarks().forEach((mark) => mark.clear());

  try {
    const cleanRegex = regex.replace(/^\/|\/$/g, ""); // Remove leading/trailing slashes
    const regexObj = new RegExp(cleanRegex, "g");
    const matches = sampleText.match(regexObj);

    if (matches) {
      matchesOutput.textContent = matches.join(", ");

      // Highlight each match
      let match;
      while ((match = regexObj.exec(sampleText)) !== null) {
        editor.markText(
          editor.posFromIndex(match.index),
          editor.posFromIndex(match.index + match[0].length),
          { className: "cm-highlight" }
        );
      }
    } else {
      matchesOutput.textContent = "No matches found";
    }
  } catch (error) {
    console.error("Error applying regex:", error);
    matchesOutput.textContent = "Invalid regex pattern";
  }
}

// Event listener for manual regex input
regexInput.addEventListener("input", () => {
  const regex = regexInput.value.trim();
  const sampleText = editor.getValue(); // Get value from CodeMirror
  if (regex) {
    highlightMatches(regex, sampleText);
  }
});

// Event listener for changes in the CodeMirror editor
editor.on("change", () => {
  const regex = regexInput.value.trim();
  const sampleText = editor.getValue(); // Get value from CodeMirror
  if (regex) {
    highlightMatches(regex, sampleText);
  }
});

// Updated "Generate Regex" button listener
generateBtn.addEventListener("click", async () => {
  const patternDescription = document.getElementById("pattern").value;
  const patternMatch = document.getElementById("pattern-match").value;
  const patternNonMatch = document.getElementById("pattern-non-match").value;
  const patternLogic = document.getElementById("pattern-logic").value;

  const sampleText = editor.getValue(); // Get value from CodeMirror

  if (!regexInput.value.trim()) {
    try {
      const result = await model.generateContent(
        `Generate a regex pattern for: ${patternDescription} for test string ${sampleText}. It should match strings like ${patternMatch} and should not match strings like ${patternNonMatch} with logic ${patternLogic}`
      );
      const responseText = await result.response.text();
      console.log(responseText);
      const regexPattern = responseText.match(/```regex\s+([\s\S]*?)```/);
      const explanationMatch = responseText.match(
        /Explanation:\*\*\s([\s\S]*)/
      );

      if (regexPattern && regexPattern[1]) {
        const generatedRegex = regexPattern[1].trim();
        regexOutput.textContent = generatedRegex;
        regexInput.value = generatedRegex; // Set regexInput only if it's empty
        highlightMatches(generatedRegex, sampleText);
        aiExplanation.value = explanationMatch
          ? explanationMatch[1]
          : "No explanation provided.";
      } else {
        regexOutput.textContent =
          "Error: Unable to extract regex pattern from the response";
        aiExplanation.value = "No explanation available.";
      }
    } catch (error) {
      console.error("Error generating regex:", error);
      regexOutput.textContent = "Error generating regex";
      aiExplanation.value = "Error generating explanation.";
    }
  } else {
    try {
      const result = await model.generateContent(
        `Generate a regex pattern for: ${patternDescription} for test string ${sampleText}`
      );
      const responseText = await result.response.text();
      const regexPattern = responseText.match(/```regex\s+([\s\S]*?)```/);

      if (regexPattern && regexPattern[1]) {
        const generatedRegex = regexPattern[1].trim();
        regexOutput.textContent = generatedRegex; // Update only regexOutput
        highlightMatches(generatedRegex, sampleText); // Highlight matches
      } else {
        regexOutput.textContent =
          "Error: Unable to extract regex pattern from the response";
      }
    } catch (error) {
      console.error("Error generating regex:", error);
      regexOutput.textContent = "Error generating regex";
    }
  }
});

document.getElementById("copyRegexBtn").addEventListener("click", function () {
  const regexText = document.getElementById("regexOutput").textContent;
  const copyButton = document.getElementById("copyRegexBtn");

  if (regexText) {
    navigator.clipboard
      .writeText(regexText)
      .then(() => {
        copyButton.textContent = "Copied!";
        setTimeout(() => {
          copyButton.textContent = "Copy Regex";
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  }
});

document.getElementById("clearBtn").addEventListener("click", function () {
  document.getElementById("pattern").value = "";
  document.getElementById("pattern-match").value = "";
  document.getElementById("pattern-non-match").value = "";
  document.getElementById("pattern-logic").value = "";
  regexOutput.textContent = "";
});
