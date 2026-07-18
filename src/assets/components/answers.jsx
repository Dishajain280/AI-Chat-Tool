import { useState } from "react";

import { checkHeading, replaceHeadingStart } from "./helper";

const Answer = ({ ans, totalResult, index, type }) => {
  const answer = useState(() => {
    if (checkHeading(ans)) {
      return replaceHeadingStart(ans);
    }
    return ans;
  })[0];

  const isHeading = checkHeading(ans);

  return (
    <>
      {index === 0 && totalResult > 1 ? (
        <span className="pt-2 text-xl block text-white font-semibold">
          {answer}
        </span>
      ) : isHeading ? (
        <span className="pt-2 text-lg block text-white font-semibold">
          {answer}
        </span>
      ) : (
        <span className={type === "q" ? "pl-1" : "pl-5"}>{answer}</span>
      )}
    </>
  );
};
export default Answer;
