import { get_encoding } from "tiktoken";

// cl100k_base is an OpenAI tokenizer — it does NOT match Llama's/Mistral's tokenizer exactly,
// but it's close enough for estimating request tokens.
const enc = get_encoding("cl100k_base");

export function countTokens(text = "") {
  try {
    return enc.encode(text).length;
  } catch (err) {
    console.error("Token count error:", err);
    return 0;
  }
}

export function truncateByTokens(text = "", maxTokens = 500) {
  if (!text) return "";
  const tokens = enc.encode(text);
  if (tokens.length <= maxTokens) return text;

  const truncated = tokens.slice(0, maxTokens);
  return new TextDecoder().decode(enc.decode(truncated));
}
