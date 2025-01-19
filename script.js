import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = prompt("Enter your Gemini API_KEY here");
if (!API_KEY) alert("API key is missing. Regexie cannot function without it.");

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const regexInput = document.getElementById("regexInput");
const sampleTextElem = document.getElementById("sampleText");
const generateBtn = document.getElementById("generateBtn");
const regexOutput = document.getElementById("regexOutput");
const matchesOutput = document.getElementById("matchesOutput");
const aiExplanation = document.getElementById("aiExplanation");
const copyRegexBtn = document.getElementById("copyRegexBtn");
const clearBtn = document.getElementById("clearBtn");

const editor = CodeMirror.fromTextArea(sampleTextElem, {
  lineWrapping: true,
  lineNumbers: true,
  mode: "javascript",
  theme: "default",
});

// Utility: Debounce Function
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

// Clear Highlights Function
function clearHighlights() {
  editor.getAllMarks().forEach((mark) => mark.clear());
  matchesOutput.textContent = "No matches found.";
}

// Highlight Matches in CodeMirror
function highlightMatches(regex, sampleText) {
  clearHighlights();

  if (!regex.trim()) {
    matchesOutput.textContent = "No matches found.";
    return;
  }

  try {
    const cleanRegex = regex.replace(/^\/|\/$/g, "");
    const regexObj = new RegExp(cleanRegex, "g");
    const matches = sampleText.match(regexObj);

    if (matches) {
      regexInput.classList.remove("errorRegex");
      matchesOutput.textContent = matches.join(", ");
      let match;
      while ((match = regexObj.exec(sampleText)) !== null) {
        editor.markText(
          editor.posFromIndex(match.index),
          editor.posFromIndex(match.index + match[0].length),
          { className: "cm-highlight" }
        );
      }
    } else {
      regexInput.classList.remove("errorRegex");
      matchesOutput.textContent = "No matches found.";
    }
  } catch (error) {
    console.error("Error applying regex:", error);
    matchesOutput.textContent = "Invalid regex pattern.";
    regexInput.classList.add("errorRegex");
  }
}

// Regex Input Listener with Debouncing
regexInput.addEventListener(
  "input",
  debounce(() => {
    const regex = regexInput.value.trim();
    const sampleText = editor.getValue();
    if (regex) highlightMatches(regex, sampleText);
  }, 300)
);

// CodeMirror Change Listener with Debouncing
editor.on(
  "change",
  debounce(() => {
    const regex = regexInput.value.trim();
    const sampleText = editor.getValue();
    if (regex) highlightMatches(regex, sampleText);
  }, 300)
);

// Generate Regex Button Listener
generateBtn.addEventListener("click", async () => {
  const description = document.getElementById("pattern").value;
  const matches = document.getElementById("pattern-match").value;
  const nonMatches = document.getElementById("pattern-non-match").value;
  const logic = document.getElementById("pattern-logic").value;
  const sampleText = editor.getValue();
  console.log(sampleText);

  try {
    const result = await model.generateContent(
      `Generate a regex pattern for: ${description} for text: ${sampleText}.  ${
        matches && "Match:" + matches
      }  ${nonMatches && "Avoid:" + nonMatches} ${logic && ". Logic:" + logic}.`
    );
    const responseText = await result.response.text();
    console.log(responseText);
    const regexMatch = responseText.match(/```regex\s+([\s\S]*?)```/);
    const explanationMatch = responseText.match(/Explanation:\*\*\s([\s\S]*)/);

    if (regexMatch && regexMatch[1]) {
      const generatedRegex = regexMatch[1].trim();
      regexOutput.textContent = generatedRegex;
      regexInput.value = regexInput.value.trim()
        ? regexInput.value
        : generatedRegex;
      highlightMatches(generatedRegex, sampleText);
      aiExplanation.value = explanationMatch
        ? explanationMatch[1]
        : "No explanation provided.";
    } else {
      regexOutput.textContent = "Error: Unable to extract regex.";
      aiExplanation.value = "Explanation not available.";
    }
  } catch (error) {
    console.error("Error generating regex:", error);
    regexOutput.textContent = "Error generating regex.";
    aiExplanation.value = "Error retrieving explanation.";
  }
});

// Copy Regex Button Listener
copyRegexBtn.addEventListener("click", () => {
  const regexText = regexOutput.textContent;
  if (regexText) {
    navigator.clipboard
      .writeText(regexText)
      .then(() => {
        copyRegexBtn.textContent = "Copied!";
        setTimeout(() => (copyRegexBtn.textContent = "Copy Regex"), 2000);
      })
      .catch((err) => console.error("Failed to copy:", err));
  }
});

// Clear Button Listener
clearBtn.addEventListener("click", () => {
  ["pattern", "pattern-match", "pattern-non-match", "pattern-logic"].forEach(
    (id) => (document.getElementById(id).value = "")
  );
  regexOutput.textContent = "";
  matchesOutput.textContent = "";
  aiExplanation.value = "";
  regexInput.value = "";
  editor.setValue("");
});

// Keydown Listener to Clear Highlights on Backspace or Delete
regexInput.addEventListener("keydown", (e) => {
  if (e.key === "Backspace" || e.key === "Delete") {
    const regex = regexInput.value.trim();
    const sampleText = editor.getValue();
    if (!regex) {
      clearHighlights();
    }
  }
});
