// Build a web page  with a clickable button and a click count. Every time that the button is clicked, the number increases by 1. When the web page is refreshed, the click count number should reflect all previous clicks. That means, refreshing the page should not reset the count to 0 or any other default number.

import React, { useEffect, useState } from "react";

const ClickCounter = () => {
  const [count, setCount] = useState(0);

  const handleClickCount = () => {
    const increasedCount = count + 1;
    localStorage.setItem("clickCount", increasedCount);
    setCount(increasedCount);
  };

  useEffect(() => {
    const storedCount = localStorage.getItem("clickCount");
    if (storedCount) {
      setCount(parseInt(storedCount));
    }
  }, []);

  return (
    <div>
      <button onClick={handleClickCount}>Click Me</button>
      <p>Click Count: {count}</p>
    </div>
  );
};

export default ClickCounter;