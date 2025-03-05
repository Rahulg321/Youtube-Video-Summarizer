"use client";

import { useState } from "react";

const CreateResourceButton = ({ content }: { content: string }) => {
  const [resourceContent, setResourceContent] = useState(content);
  return <button>CreateResourceButton</button>;
};

export default CreateResourceButton;
