import "./App.css";
import { useRef, useState } from "react";
import { URL } from "./assets/components/constants";
import Answer from "./assets/components/answers.jsx";

function App() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState([]);
  const [recentHistory, setRecentHistory] = useState(
    JSON.parse(localStorage.getItem("history")),
  );
  const scrollToAns = useRef();
  const [loader, setLoader] = useState(false);

  // const id = useId();

  const payload = {
    contents: [
      {
        parts: [
          {
            text: question,
          },
        ],
      },
    ],
  };
  const askQuestion = async () => {
    if (!question) {
      return false;
    }

    if (localStorage.getItem("history")) {
      let history = JSON.parse(localStorage.getItem("history"));
      history = [question, ...history];
      localStorage.setItem("history", JSON.stringify(history));
      setRecentHistory(history);
    } else {
      localStorage.setItem("history", JSON.stringify([question]));
      setRecentHistory([question]);
    }

    setLoader(true);
    try {
      let response = await fetch(URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      response = await response.json();
      let dataString = response.candidates[0].content.parts[0].text;
      dataString = dataString.split("* ");
      dataString = dataString.map((item) => item.trim());
      // console.log(dataString);
      setResult([
        ...result,
        { type: "q", text: question },
        { type: "a", text: dataString },
      ]);
      setQuestion("");
    } catch (error) {
      console.error("Error fetching answer:", error);
      setResult([
        ...result,
        { type: "q", text: question },
        {
          type: "a",
          text: [
            "Sorry, there was an error getting the answer. Please try again.",
          ],
        },
      ]);
      setQuestion("");
    }

    setTimeout(() => {
      scrollToAns.current.scrollTop = scrollToAns.current.scrollHeight;
    }, 500);
    setLoader(false);
  };

  const isEnter = (event) => {
    if (event.key === "Enter") {
      askQuestion();
    }
  };

  return (
    <div className="flex h-screen bg-zinc-900">
      <div className="w-1/5 bg-gradient-to-b from-zinc-800 to-zinc-900 border-r border-zinc-700 flex flex-col">
        <div className="p-4 border-b border-zinc-700">
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Recent Search
          </h1>
        </div>
        <ul className="text-left overflow-y-auto flex-1 text-sm">
          {recentHistory &&
            recentHistory.map((item, idx) => (
              <li
                key={idx}
                className="p-3 pl-5 truncate text-zinc-400 cursor-pointer hover:bg-zinc-700 hover:text-white transition-colors border-b border-zinc-800 last:border-b-0"
              >
                {item}
              </li>
            ))}
        </ul>
      </div>
      <div className="flex-1 flex flex-col p-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
            Ask Me Anything
          </h1>
          <p className="text-zinc-400 mt-2">Powered by Gemini AI</p>
        </div>
        {loader ? (
          <div className="flex items-center justify-center py-8" role="status">
            <svg
              aria-hidden="true"
              className="inline w-10 h-10 text-purple-500 animate-spin"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
                opacity="0.2"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentColor"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        ) : null}
        <div
          ref={scrollToAns}
          className="flex-1 overflow-y-auto bg-zinc-800 bg-opacity-50 text-left p-6 rounded-xl mb-6 border border-zinc-700 backdrop-blur-sm"
        >
          <div className="text-zinc-200">
            <div className="space-y-4">
              {result.map((item, index) => (
                <div
                  key={index}
                  className={`flex ${item.type === "q" ? "justify-end" : "justify-start"}`}
                >
                  {item.type === "q" ? (
                    <div className="max-w-md">
                      <p className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-3 rounded-lg rounded-br-none">
                        <Answer
                          ans={item.text}
                          totalResult={1}
                          index={0}
                          type={item.type}
                        />
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-2xl space-y-3">
                      {item.text.map((ansItem, ansIndex) => (
                        <p
                          key={`${index}-${ansIndex}`}
                          className="bg-zinc-700 bg-opacity-60 text-zinc-100 text-sm px-4 py-3 rounded-lg"
                        >
                          <Answer
                            ans={ansItem}
                            totalResult={item.text.length}
                            index={ansIndex}
                            type={item.type}
                          />
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex-1 flex items-center bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 hover:border-purple-500 transition-colors">
            <input
              type="text"
              value={question}
              onKeyDown={isEnter}
              onChange={(event) => setQuestion(event.target.value)}
              className="w-full bg-transparent text-white outline-none placeholder-zinc-500 text-sm"
              placeholder="Ask me anything..."
            />
          </div>
          <button
            onClick={askQuestion}
            disabled={!question.trim() || loader}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loader ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
